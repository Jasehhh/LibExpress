import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist, Newsreader } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "LibExpress",
  description: "Library management: catalog, circulation, and fines",
  icons: [{ rel: "icon", url: "/logo.svg", type: "image/svg+xml" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${newsreader.variable}`}>
      <body>
          <TRPCReactProvider>
            {children}
          </TRPCReactProvider>
      </body>
    </html>
  );
}
