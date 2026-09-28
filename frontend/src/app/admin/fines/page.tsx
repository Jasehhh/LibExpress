import type { Metadata } from "next";
import { FinesScreen } from "./FinesScreen";

export const metadata: Metadata = { title: "Fines" };

export default function Page() {
  return <FinesScreen />;
}
