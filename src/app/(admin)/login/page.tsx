import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "~/components/admin/login-form";
import { type Book } from "~/lib/types";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

// Cover widths cycle through these so the row reads like real books of
// different sizes rather than a grid of thumbnails.
const COVER_WIDTHS = ["w-32", "w-36", "w-28", "w-[9.5rem]", "w-[7.5rem]"];

// Newest books that have a cover image, for the shelf. Sign-in must still
// work when the catalog can't be read, so a failure just means no shelf.
async function shelfBooks(): Promise<Book[]> {
  try {
    const books = await api.book.getAll();
    return books
      .filter((book) => book.url)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 12);
  } catch {
    return [];
  }
}

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/dashboard");
  const books = await shelfBooks();

  return (
    <main className="bg-surface relative flex min-h-screen overflow-hidden">
      {/* Left: the front desk, with the newest covers on a shelf (hidden on small screens) */}
      <section className="relative hidden min-w-0 flex-1 flex-col justify-between py-10 pr-32 pl-14 lg:flex xl:pl-20">
        <Link href="/" className="flex w-fit items-center gap-2.5">
          <Image
            src="/logo.svg"
            alt=""
            width={845}
            height={728}
            priority
            unoptimized
            className="h-auto w-10"
          />
          <span className="text-navy text-xl font-bold tracking-tight">
            LibExpress
          </span>
        </Link>

        <div className="max-w-xl">
          <h2 className="text-navy font-serif text-7xl leading-[1.02] font-medium">
            The front desk.
          </h2>
          <p className="text-muted mt-5 text-lg leading-relaxed">
            Sign in to lend books and check them back in, and to keep track of
            members and fines.
          </p>
        </div>

        <div aria-hidden>
          <div className="flex items-end gap-2 overflow-hidden px-3">
            {books.map((book, i) => (
              <div
                key={book.id}
                className={`relative aspect-[2/3] shrink-0 overflow-hidden rounded-t-sm shadow-[2px_0_6px_rgba(24,36,66,0.25)] ${COVER_WIDTHS[i % COVER_WIDTHS.length]}`}
              >
                <Image
                  src={book.url!}
                  alt=""
                  fill
                  sizes="10rem"
                  unoptimized
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          <div className="h-3 rounded-sm bg-[#5a4031] shadow-[0_6px_0_#3b2a20,0_18px_24px_-8px_rgba(24,36,66,0.35)]" />
        </div>
      </section>

      {/* Right: form panel */}
      <section className="bg-navy relative flex w-full items-center justify-center px-6 py-12 lg:w-[45%]">
        {/* Wavy edge */}
        <svg
          aria-hidden
          viewBox="0 0 100 800"
          preserveAspectRatio="none"
          className="text-navy absolute inset-y-0 right-full hidden h-full w-24 lg:block"
        >
          <path
            d="M100 0 H40 C0 120 80 220 40 340 C0 460 70 560 30 680 C10 740 40 780 50 800 H100 Z"
            fill="currentColor"
          />
        </svg>

        <div className="w-full max-w-sm">
          <Image
            src="/logo.svg"
            alt="LibExpress"
            width={96}
            height={96}
            priority
            unoptimized
            className="mx-auto mb-6 rounded-full bg-white p-4 lg:hidden"
          />
          <h1 className="mb-8 text-center text-4xl font-bold tracking-wide text-white">
            LOGIN
          </h1>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
