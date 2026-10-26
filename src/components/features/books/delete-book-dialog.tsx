"use client";

import { Dialog } from "~/components/ui/dialog";
import { BUTTON_CLASS } from "~/components/ui/form-field";
import { type Book } from "~/lib/types";
import { api } from "~/trpc/react";

export function DeleteBookDialog({
  book,
  onClose,
}: {
  book: Book | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!book} onClose={onClose} size="sm" title="Delete this book?">
      {book && <DeleteBook book={book} onDone={onClose} />}
    </Dialog>
  );
}

function DeleteBook({ book, onDone }: { book: Book; onDone: () => void }) {
  const utils = api.useUtils();
  const remove = api.book.delete.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.book.getAll.invalidate(),
        utils.dashboard.invalidate(),
      ]);
      onDone();
    },
  });

  return (
    <>
      <p className="text-sm leading-relaxed">
        <span className="font-semibold">{book.title}</span>
        {book.totalCopies > 0 &&
          ` and its ${book.totalCopies === 1 ? "copy" : `${book.totalCopies} copies`}`}{" "}
        will be removed from the catalog. This can&apos;t be undone.
      </p>
      <p className="text-muted mt-2 text-sm">
        Books that have ever been borrowed can&apos;t be deleted, so their loan
        history stays intact. Set their copies to 0 instead.
      </p>

      {remove.error && (
        <p
          role="alert"
          className="bg-danger-light text-danger mt-4 rounded-lg px-3 py-2 text-sm"
        >
          {remove.error.message}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onDone}
          className={BUTTON_CLASS.secondary}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => remove.mutate({ id: book.id })}
          disabled={remove.isPending}
          className={BUTTON_CLASS.danger}
        >
          {remove.isPending ? "Deleting…" : "Delete book"}
        </button>
      </div>
    </>
  );
}
