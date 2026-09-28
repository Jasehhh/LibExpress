import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Literata } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin"],
  // next/font has no metrics for this family, so skip the adjusted fallback.
  adjustFontFallback: false,
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: {
    default: "LibExpress",
    template: "%s | LibExpress",
  },
  description:
    "Browse the library catalogue, and manage books, members, loans and fines.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${atkinson.variable} ${literata.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
