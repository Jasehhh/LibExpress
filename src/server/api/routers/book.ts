import { type Prisma } from "../../../../generated/prisma";

import { bookInput, bookPatchInput } from "~/lib/schemas/book";
import { idInput } from "~/lib/schemas/common";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { diff, logActivity } from "~/server/lib/activityLog";
import { badRequest, conflict, lockRow, notFound } from "~/server/lib/db";
import {
  BOOK_INCLUDE,
  bookLogRow,
  type BookWithIncludes,
  serializeBook,
} from "~/server/lib/derived";

type Tx = Prisma.TransactionClient;

const assertAuthorsExist = async (tx: Tx, authorIds: string[]) => {
  const found = await tx.author.count({ where: { id: { in: authorIds } } });
  if (found !== authorIds.length) throw badRequest("Author not found");
};

const assertIsbnFree = async (tx: Tx, isbn: string) => {
  const taken = await tx.book.findUnique({
    where: { isbn },
    select: { id: true },
  });
  if (taken) throw conflict("This book already exists.");
};

const authorLinks = (authorIds: string[]) =>
  authorIds.map((authorId) => ({ authorId }));

const copyNumbers = (from: number, count: number) =>
  Array.from({ length: count }, (_, i) => ({ copyNo: from + i }));

async function setCopyCount(tx: Tx, book: BookWithIncludes, total: number) {
  const copies = book.copies;

  if (total > copies.length) {
    const { _max } = await tx.bookCopy.aggregate({
      where: { bookId: book.id },
      _max: { copyNo: true },
    });
    await tx.bookCopy.createMany({
      data: copyNumbers((_max.copyNo ?? 0) + 1, total - copies.length).map(
        (copy) => ({ ...copy, bookId: book.id }),
      ),
    });
  }

  if (total < copies.length) {
    const onShelf = copies.filter((copy) => copy._count.loans === 0);
    const onLoan = copies.length - onShelf.length;
    if (total < onLoan) {
      throw badRequest(
        `Total copies cannot be less than the ${onLoan} copies currently on loan.`,
      );
    }
    const withdrawn = onShelf
      .slice(-(copies.length - total))
      .map((copy) => copy.copyNo);
    await tx.bookCopy.updateMany({
      where: { bookId: book.id, copyNo: { in: withdrawn } },
      data: { withdrawnAt: new Date() },
    });
  }
}

export const bookRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const books = await ctx.db.book.findMany({
      include: BOOK_INCLUDE,
      orderBy: { title: "asc" },
    });
    return books.map(serializeBook);
  }),

  getById: publicProcedure.input(idInput).query(async ({ ctx, input }) => {
    const book = await ctx.db.book.findUnique({
      where: { id: input.id },
      include: BOOK_INCLUDE,
    });
    if (!book) throw notFound("Book not found");
    return serializeBook(book);
  }),

  create: protectedProcedure.input(bookInput).mutation(({ ctx, input }) =>
    ctx.db.$transaction(async (tx) => {
      const { authorIds, totalCopies, ...data } = input;

      await assertIsbnFree(tx, data.isbn);
      await assertAuthorsExist(tx, authorIds);

      const book = await tx.book.create({
        data: {
          ...data,
          authors: { create: authorLinks(authorIds) },
          copies: { create: copyNumbers(1, totalCopies) },
        },
        include: BOOK_INCLUDE,
      });

      await logActivity(tx, ctx.session, {
        action: "CREATE",
        entity: "book",
        entityId: book.id,
        details: { after: bookLogRow(book) },
      });

      return serializeBook(book);
    }),
  ),

  update: protectedProcedure
    .input(idInput.extend({ data: bookPatchInput }))
    .mutation(({ ctx, input }) =>
      ctx.db.$transaction(async (tx) => {
        const { id } = input;
        const { authorIds, totalCopies, ...data } = input.data;

        if (!(await lockRow(tx, "book", id))) throw notFound("Book not found");
        const before = await tx.book.findUniqueOrThrow({
          where: { id },
          include: BOOK_INCLUDE,
        });

        if (data.isbn !== undefined && data.isbn !== before.isbn) {
          await assertIsbnFree(tx, data.isbn);
        }
        if (authorIds !== undefined) await assertAuthorsExist(tx, authorIds);
        if (totalCopies !== undefined) {
          await setCopyCount(tx, before, totalCopies);
        }

        const book = await tx.book.update({
          where: { id },
          data: {
            ...data,
            authors: authorIds && {
              deleteMany: {},
              create: authorLinks(authorIds),
            },
          },
          include: BOOK_INCLUDE,
        });

        const changes = diff(bookLogRow(before), bookLogRow(book));
        if (changes) {
          await logActivity(tx, ctx.session, {
            action: "UPDATE",
            entity: "book",
            entityId: book.id,
            details: changes,
          });
        }

        return serializeBook(book);
      }),
    ),

  delete: protectedProcedure.input(idInput).mutation(({ ctx, input }) =>
    ctx.db.$transaction(async (tx) => {
      if (!(await lockRow(tx, "book", input.id))) {
        throw notFound("Book not found");
      }
      const book = await tx.book.findUniqueOrThrow({
        where: { id: input.id },
        include: BOOK_INCLUDE,
      });

      const loan = await tx.loan.findFirst({
        where: { bookId: input.id },
        orderBy: { returnDate: { sort: "desc", nulls: "first" } },
        select: { returnDate: true },
      });
      if (loan?.returnDate === null) {
        throw badRequest("Cannot delete a book with active loans");
      }
      if (loan) throw conflict("Cannot delete a book that has loan history.");

      await tx.book.delete({ where: { id: input.id } });

      await logActivity(tx, ctx.session, {
        action: "DELETE",
        entity: "book",
        entityId: book.id,
        details: { before: bookLogRow(book) },
      });

      return serializeBook(book);
    }),
  ),
});
