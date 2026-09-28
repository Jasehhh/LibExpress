import type { Metadata } from "next";
import { fetchBook } from "@/app/api/bookService";
import { isUuid } from "@/lib/schemas/validate";
import { BookScreen } from "./BookScreen";

export async function generateMetadata({ params }: PageProps<"/books/[id]">): Promise<Metadata> {
  const { id } = await params;
  if (!isUuid(id)) return { title: "Book not found" };
  try {
    const book = await fetchBook(id);
    return {
      title: book.title,
      description: book.description ?? `${book.title} by ${book.author.first_name} ${book.author.last_name}`,
    };
  } catch {
    return { title: "Book" };
  }
}

export default async function Page({ params }: PageProps<"/books/[id]">) {
  const { id } = await params;
  return <BookScreen id={id} />;
}
