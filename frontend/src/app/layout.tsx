import { AuthProvider } from "@/lib/context/AuthContext";
import { LibraryProvider } from "@/lib/context/LibraryContext";


<AuthProvider>
  <LibraryProvider>{children}</LibraryProvider>
</AuthProvider>
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
