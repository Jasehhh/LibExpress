import type { Metadata } from "next";
import { AuthorsScreen } from "./AuthorsScreen";

export const metadata: Metadata = { title: "Authors" };

export default function Page() {
  return <AuthorsScreen />;
}
