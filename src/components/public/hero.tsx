import Image from "next/image";

import { authorNames, BookCover } from "~/components/features/books/book-cover";
import { type Book } from "~/lib/types";

export function Hero({ featured }: { featured: Book | undefined }) {
  return (
    <section className="bg-navy text-on-navy relative isolate overflow-hidden rounded-2xl">
      <Image
        src="/hero-library.svg"
        alt=""
        fill
        priority
        unoptimized
        className="-z-10 object-cover"
      />
      <div
        aria-hidden
        className="from-navy/95 via-navy/55 absolute inset-0 -z-10 bg-gradient-to-r to-transparent"
      />

      <div className="flex min-h-[22rem] items-end gap-10 px-6 py-8 sm:px-10 sm:py-10 lg:min-h-[26rem]">
        {featured ? <Featured book={featured} /> : <Welcome />}
      </div>
    </section>
  );
}

function Featured({ book }: { book: Book }) {
  const onShelf = book.availableCopies > 0;
  return (
    <>
      <div className="max-w-xl">
        <p className="text-on-navy-muted mb-3 text-sm">
          Added{" "}
          {book.createdAt.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <h1 className="font-serif text-4xl leading-[1.05] font-medium text-balance sm:text-5xl">
          {book.title}
        </h1>
        <p className="text-on-navy-muted mt-2">{authorNames(book)}</p>
        {book.description && (
          <p className="mt-4 line-clamp-3 max-w-prose text-sm leading-relaxed text-white/85 sm:text-base">
            {book.description}
          </p>
        )}
        <p className="mt-6 text-sm text-white/85">
          {onShelf
            ? `${book.availableCopies} of ${book.totalCopies} available`
            : "All copies on loan"}
        </p>
      </div>

      <div className="relative ml-auto hidden aspect-[2/3] w-40 shrink-0 -rotate-3 overflow-hidden rounded-md shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)] ring-1 ring-white/10 md:block lg:w-48">
        <BookCover book={book} sizes="12rem" priority />
      </div>
    </>
  );
}

function Welcome() {
  return (
    <div className="max-w-xl">
      <h1 className="font-serif text-4xl leading-[1.05] font-medium text-balance sm:text-5xl">
        Every book in the library, and whether it’s on the shelf.
      </h1>
      <p className="text-on-navy-muted mt-4">
        The catalog fills up as staff add books.
      </p>
    </div>
  );
}
