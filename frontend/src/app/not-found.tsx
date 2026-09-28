import Link from "next/link";
import { Brand } from "@/components/Brand";
import { buttonClass } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main id="main" className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <Brand />
        <h1 className="mt-10 font-serif text-[2.25rem] font-semibold leading-tight">This page isn&apos;t on our shelves</h1>
        <p className="mt-3 text-ink-soft">The link may be old or mistyped. Search the catalogue to find what you need.</p>
        <Link href="/" className={`${buttonClass()} mt-8`}>
          Go to the catalogue
        </Link>
      </div>
    </main>
  );
}
