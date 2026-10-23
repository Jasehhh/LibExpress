import Image from "next/image";

import { type Book } from "~/lib/types";

// Spine colours for books without a cover image, picked by id so a book
// always gets the same one.
const PLAIN_COVERS = [
  "bg-navy text-on-navy",
  "bg-primary text-white",
  "bg-info text-white",
  "bg-[#6b2d3a] text-white",
  "bg-[#a0763a] text-white",
];

export const authorNames = (book: Book) =>
  book.authors
    .map((author) => `${author.firstName} ${author.lastName}`)
    .join(", ");

export function BookCover({
  book,
  sizes,
  priority,
}: {
  book: Book;
  sizes: string;
  priority?: boolean;
}) {
  if (book.url) {
    return (
      <Image
        src={book.url}
        alt={`Cover of ${book.title}`}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized
        className="object-cover"
      />
    );
  }

  const hash = [...book.id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (
    <div
      className={`flex h-full flex-col justify-between p-4 ${PLAIN_COVERS[hash % PLAIN_COVERS.length]}`}
    >
      <p className="font-serif text-lg leading-tight text-balance">
        {book.title}
      </p>
      <p className="text-xs opacity-80">{authorNames(book)}</p>
    </div>
  );
}
