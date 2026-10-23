"use client";

import Image from "next/image";
import { useState } from "react";

import { authorNames, BookCover } from "~/components/features/books/book-cover";
import { type Book } from "~/lib/types";

export function Hero({ featured }: { featured: Book[] }) {
  const [index, setIndex] = useState(0);
  const book = featured[index];
  const step = (by: number) =>
    setIndex((current) => (current + by + featured.length) % featured.length);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="New books"
      className="bg-navy text-on-navy relative isolate overflow-hidden rounded-2xl"
    >
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

      <div className="flex min-h-[26rem] items-end gap-10 px-6 py-8 sm:px-10 sm:py-10 lg:min-h-[28rem]">
        {book ? (
          <div
            key={book.id}
            aria-live="polite"
            className="motion-safe:animate-fade-in flex w-full items-end gap-10"
          >
            <Featured book={book} />
          </div>
        ) : (
          <Welcome />
        )}
      </div>

      {featured.length > 1 && (
        <div className="absolute bottom-6 left-6 flex items-center gap-3 sm:bottom-10 sm:left-10">
          <span className="text-on-navy-muted text-sm tabular-nums">
            {index + 1} of {featured.length}
          </span>
          <StepButton label="Previous book" onClick={() => step(-1)}>
            <path d="m15 6-6 6 6 6" />
          </StepButton>
          <StepButton label="Next book" onClick={() => step(1)}>
            <path d="m9 6 6 6-6 6" />
          </StepButton>
        </div>
      )}
    </section>
  );
}

function StepButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </button>
  );
}

function Featured({ book }: { book: Book }) {
  const onShelf = book.availableCopies > 0;
  return (
    <>
      <div className="max-w-xl pb-14">
        <p className="text-on-navy-muted mb-3 text-sm">
          Added{" "}
          {book.createdAt.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
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
