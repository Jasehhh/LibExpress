import { type Book } from "~/lib/types";
import { authorNames, BookCover } from "./book-cover";

export function BookCard({ book }: { book: Book }) {
  return (
    <article>
      <div className="bg-surface-muted relative aspect-[2/3] overflow-hidden rounded-md shadow-[0_1px_0_var(--color-border),0_8px_20px_-12px_rgba(24,36,66,0.45)]">
        <BookCover
          book={book}
          sizes="(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 45vw"
        />
      </div>
      <h3 className="mt-3 line-clamp-2 text-sm leading-snug font-semibold">
        {book.title}
      </h3>
      <p className="text-muted mt-0.5 line-clamp-1 text-sm">
        {authorNames(book)}
      </p>
      <Availability book={book} />
    </article>
  );
}

function Availability({ book }: { book: Book }) {
  if (book.availableCopies > 0) {
    return (
      <p className="text-primary-light mt-1.5 text-xs font-medium">
        {book.availableCopies} of {book.totalCopies} available
      </p>
    );
  }
  return (
    <p className="text-muted mt-1.5 text-xs">
      {book.totalCopies > 0 ? "All copies on loan" : "No copies yet"}
    </p>
  );
}
