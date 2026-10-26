"use client";

import Link from "next/link";

import { Panel, PanelEmpty } from "~/components/admin/panel";
import { useDashboard } from "~/components/admin/use-dashboard";
import { authorNames, BookCover } from "~/components/features/books/book-cover";

export function PopularBooks() {
  const { popularBooks: books } = useDashboard();

  return (
    <Panel title="Most borrowed books">
      {books.length > 0 ? (
        <ol className="divide-border divide-y px-5 pb-2 sm:px-6">
          {books.map((book, i) => (
            <li key={book.id} className="flex items-center gap-4 py-3">
              <span className="text-muted w-4 shrink-0 text-right text-sm font-semibold tabular-nums">
                {i + 1}
              </span>
              <div className="relative aspect-[2/3] w-9 shrink-0 overflow-hidden rounded-md shadow-[1px_1px_4px_rgba(24,36,66,0.25)]">
                <BookCover book={book} sizes="2.25rem" compact />
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/books/${book.id}`}
                  className="text-foreground focus-visible:ring-primary-light block truncate rounded text-sm font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
                >
                  {book.title}
                </Link>
                <p className="text-muted truncate text-sm">
                  {authorNames(book)}
                </p>
              </div>
              <p className="text-navy shrink-0 text-sm font-bold tabular-nums">
                {book.loans} {book.loans === 1 ? "loan" : "loans"}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <PanelEmpty title="No checkouts yet">
          The books members borrow most show up here.
        </PanelEmpty>
      )}
    </Panel>
  );
}
