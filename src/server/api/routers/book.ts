import { type Prisma } from "../../../../generated/prisma";

import { bookInput, bookPatchInput } from "~/lib/schemas/book";
import { idInput } from "~/lib/schemas/common";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { diff, logActivity } from "~/server/lib/activityLog";
import {
  badRequest,
  conflict,
  isForeignKeyViolation,
  lockRow,
  notFound,
} from "~/server/lib/db";
import {
  BOOK_INCLUDE,
  bookLogRow,
  OPEN_LOAN,
  serializeBook,
} from "~/server/lib/derived";

const assertAuthorsExist = async (
  tx: Prisma.TransactionClient,
  authorIds: string[],
) => {
  const found = await tx.author.count({ where: { id: { in: authorIds } } });
  if (found !== authorIds.length) throw badRequest("Author not found");
};

const authorLinks = (authorIds: string[]) =>
  authorIds.map((authorId) => ({ authorId }));

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
      const { authorIds, ...data } = input;

      const existing = await tx.book.findUnique({
        where: { isbn: data.isbn },
        select: { id: true },
      });
      if (existing) throw conflict("This book already exists.");

      await assertAuthorsExist(tx, authorIds);

      const book = await tx.book.create({
        data: { ...data, authors: { create: authorLinks(authorIds) } },
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
        const { authorIds, ...data } = input.data;

        // Checkouts lock the book too, so the copy count can't move under us.
        if (!(await lockRow(tx, "book", id))) throw notFound("Book not found");
        const before = await tx.book.findUniqueOrThrow({
          where: { id },
          include: BOOK_INCLUDE,
        });

        if (data.isbn !== undefined && data.isbn !== before.isbn) {
          const taken = await tx.book.findUnique({
            where: { isbn: data.isbn },
            select: { id: true },
          });
          if (taken) throw conflict("This book already exists.");
        }

        if (authorIds !== undefined) await assertAuthorsExist(tx, authorIds);

        const onLoan = before._count.loans;
        if (data.totalCopies !== undefined && data.totalCopies < onLoan) {
          throw badRequest(
            `Total copies cannot be less than the ${onLoan} copies currently on loan.`,
          );
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

  delete: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    try {
      return await ctx.db.$transaction(async (tx) => {
        const openLoans = await tx.loan.count({
          where: { bookId: input.id, ...OPEN_LOAN },
        });
        if (openLoans > 0) {
          throw badRequest("Cannot delete a book with active loans");
        }

        const book = await tx.book.findUnique({
          where: { id: input.id },
          include: BOOK_INCLUDE,
        });
        if (!book) throw notFound("Book not found");

        // Its book_author links go with it.
        await tx.book.delete({ where: { id: input.id } });

        await logActivity(tx, ctx.session, {
          action: "DELETE",
          entity: "book",
          entityId: book.id,
          details: { before: bookLogRow(book) },
        });

        return serializeBook(book);
      });
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw conflict("Cannot delete a book that has loan history.");
      }
      throw error;
    }
  }),
});
