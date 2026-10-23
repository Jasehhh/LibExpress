"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { BACK_CLASS, BackArrow } from "~/components/features/books/back-button";

// Shows a book over the catalog. Closing it (Escape, the backdrop, or the
// back button) goes back in history, so the URL returns to the catalog.
export function BookModal({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();
    const root = document.documentElement;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = "";
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-label={title}
      onClose={() => router.back()}
      onClick={(event) => {
        if (event.target === dialog.current) dialog.current.close();
      }}
      className="bg-background m-auto max-h-[calc(100dvh-2rem)] w-[min(60rem,calc(100vw-2rem))] max-w-none overflow-hidden rounded-2xl p-0 shadow-2xl backdrop:bg-[#0a0f1e]/70 backdrop:backdrop-blur-sm max-md:overflow-y-auto"
    >
      {children}
    </dialog>
  );
}

export function BackToCatalogButton() {
  return (
    <button
      type="button"
      aria-label="Back to the catalog"
      onClick={(event) => event.currentTarget.closest("dialog")?.close()}
      className={BACK_CLASS}
    >
      <BackArrow />
    </button>
  );
}
