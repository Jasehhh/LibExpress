import type { Metadata } from "next";
import { MemberScreen } from "./MemberScreen";

export const metadata: Metadata = { title: "Member" };

export default async function Page({ params }: PageProps<"/admin/members/[id]">) {
  const { id } = await params;
  return <MemberScreen id={id} />;
}
