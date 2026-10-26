import { type Metadata } from "next";
import Link from "next/link";

import { BACK_CLASS, BackArrow } from "~/components/features/books/back-button";
import { BookDetails, getBook } from "~/components/features/books/book-details";
import { SiteHeader } from "~/components/ui/site-header";

type Params = Promise<{ id: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const book = await getBook((await params).id);
  return { title: `${book.title} | LibExpress` };
}

export default async function BookPage({ params }: { params: Params }) {
  const { id } = await params;
  const book = await getBook(id);

  return (
    <>
      <SiteHeader query="" />
      <main>
        <BookDetails
          book={book}
          inner="mx-auto max-w-6xl px-4 sm:px-6"
          layout="page"
          back={
            <Link
              href="/#catalog"
              aria-label="Back to the catalog"
              className={BACK_CLASS}
            >
              <BackArrow />
            </Link>
          }
        />
      </main>
    </>
  );
}
