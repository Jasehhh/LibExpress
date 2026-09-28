import type { Metadata } from "next";
import { MembersScreen } from "./MembersScreen";

export const metadata: Metadata = { title: "Members" };

export default function Page() {
  return <MembersScreen />;
}
