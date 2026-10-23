import Image from "next/image";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-6">
      <div className="w-full max-w-sm text-center text-white">
        <Image
          src="/logo.svg"
          alt="LibExpress"
          width={96}
          height={96}
          priority
          unoptimized
          className="mx-auto mb-6 rounded-full bg-white p-4"
        />
        <h1 className="mb-4 text-3xl font-bold tracking-wide">
          FORGOT PASSWORD
        </h1>
        <p className="mb-8 text-on-navy-muted">
          Staff accounts are managed by the system administrator. Contact them
          with your account email to get your password reset.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-md bg-info px-10 py-2 font-semibold shadow-[0_4px_0_rgba(0,0,0,0.25)] transition hover:brightness-110"
        >
          BACK TO LOGIN
        </Link>
      </div>
    </main>
  );
}
