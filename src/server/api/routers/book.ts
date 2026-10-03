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

export const bookRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) =>
    ctx.db.book.findMany({
      include: { author: true },
      orderBy: { title: "asc" },
    }),
  ),

  getById: publicProcedure.input(idInput).query(async ({ ctx, input }) => {
    const book = await ctx.db.book.findUnique({
      where: { id: input.id },
      include: { author: true },
    });
    if (!book) throw notFound("Book not found");
    return book;
  }),

  create: protectedProcedure.input(bookInput).mutation(({ ctx, input }) =>
    ctx.db.$transaction(async (tx) => {
      const existing = await tx.book.findUnique({
        where: { isbn: input.isbn },
        select: { id: true },
      });
      if (existing) throw conflict("This book already exists.");

      const author = await tx.author.findUnique({
        where: { id: input.authorId },
        select: { id: true },
      });
      if (!author) throw badRequest("Author not found");

      const book = await tx.book.create({
        data: { ...input, availableCopies: input.totalCopies },
      });

      await logActivity(tx, ctx.session, {
        action: "CREATE",
        entity: "book",
        entityId: book.id,
        details: { after: book },
      });

      return book;
    }),
  ),

  update: protectedProcedure
    .input(idInput.extend({ data: bookPatchInput }))
    .mutation(({ ctx, input }) =>
      ctx.db.$transaction(async (tx) => {
        const { id, data } = input;

        if (!(await lockRow(tx, "book", id))) throw notFound("Book not found");
        const before = await tx.book.findUniqueOrThrow({ where: { id } });

        if (data.isbn !== undefined && data.isbn !== before.isbn) {
          const taken = await tx.book.findUnique({
            where: { isbn: data.isbn },
            select: { id: true },
          });
          if (taken) throw conflict("This book already exists.");
        }

        if (data.authorId !== undefined) {
          const author = await tx.author.findUnique({
            where: { id: data.authorId },
            select: { id: true },
          });
          if (!author) throw badRequest("Author not found");
        }

        // Copies on loan stay out; the change in total goes to the shelf.
        let availableCopies: number | undefined;
        if (data.totalCopies !== undefined) {
          const onLoan = before.totalCopies - before.availableCopies;
          if (data.totalCopies < onLoan) {
            throw badRequest(
              `Total copies cannot be less than the ${onLoan} copies currently on loan.`,
            );
          }
          availableCopies = data.totalCopies - onLoan;
        }

        const book = await tx.book.update({
          where: { id },
          data: { ...data, availableCopies },
        });

        const changes = diff(before, book);
        if (changes) {
          await logActivity(tx, ctx.session, {
            action: "UPDATE",
            entity: "book",
            entityId: book.id,
            details: changes,
          });
        }

        return book;
      }),
    ),

  delete: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    try {
      return await ctx.db.$transaction(async (tx) => {
        const openLoans = await tx.loan.count({
          where: { bookId: input.id, status: { in: ["ACTIVE", "OVERDUE"] } },
        });
        if (openLoans > 0) {
          throw badRequest("Cannot delete a book with active loans");
        }

        const book = await tx.book.findUnique({ where: { id: input.id } });
        if (!book) throw notFound("Book not found");

        await tx.book.delete({ where: { id: input.id } });

        await logActivity(tx, ctx.session, {
          action: "DELETE",
          entity: "book",
          entityId: book.id,
          details: { before: book },
        });

        return book;
      });
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw conflict("Cannot delete a book that has loan history.");
      }
      throw error;
    }
  }),
});
