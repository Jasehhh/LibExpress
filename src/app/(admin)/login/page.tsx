import Image from "next/image";
import { redirect } from "next/navigation";

import { LoginForm } from "~/components/admin/login-form";
import { auth } from "~/server/auth";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/");

  return (
    <main className="bg-surface relative flex min-h-screen overflow-hidden">
      {/* Left: illustration side (hidden on small screens) */}
      <section className="relative hidden flex-1 items-center justify-center lg:flex">
        <Image
          src="/logo.svg"
          alt="LibExpress"
          width={520}
          height={520}
          priority
          unoptimized
          className="size-[min(70vh,32rem)] -translate-x-12"
        />
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
            className="mx-auto mb-6 rounded-full bg-white p-2 lg:hidden"
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
