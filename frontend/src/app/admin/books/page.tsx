import type { Metadata } from "next";
import { BooksScreen } from "./BooksScreen";

export const metadata: Metadata = { title: "Books" };

export default function Page() {
  return <BooksScreen />;
}
