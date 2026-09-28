import type { Metadata } from "next";
import { CatalogueScreen } from "./CatalogueScreen";

export const metadata: Metadata = {
  title: { absolute: "LibExpress library catalogue" },
};

export default function Home() {
  return <CatalogueScreen />;
}
