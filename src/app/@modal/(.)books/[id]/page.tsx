import { BookDetails, getBook } from "~/components/features/books/book-details";
import { BackToCatalogButton, BookModal } from "~/components/ui/book-modal";

// Opening a book from the catalog lands here instead of on /books/[id], so it
// shows over the catalog. Loading /books/[id] directly still gets the page.
export default async function BookModalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const book = await getBook((await params).id);

  return (
    <BookModal title={book.title}>
      <BookDetails
        book={book}
        inner="px-6 sm:px-10"
        layout="modal"
        back={<BackToCatalogButton />}
      />
    </BookModal>
  );
}
