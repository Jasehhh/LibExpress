import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { AuthProvider } from "~/lib/context/AuthContext";
import { LibraryProvider } from "~/lib/context/LibraryContext";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "LibExpress",
  description: "Library management: catalog, circulation, and fines",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <AuthProvider>
          <TRPCReactProvider>
            <LibraryProvider>{children}</LibraryProvider>
          </TRPCReactProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
