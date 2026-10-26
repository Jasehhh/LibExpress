"use client";

import { useEffect, useId, useRef } from "react";

// A native <dialog> opened as a modal: it traps focus, closes on Escape and
// blocks the page behind it. Children mount only while open, so forms inside
// start fresh every time.
export function Dialog({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={`bg-surface text-foreground backdrop:bg-navy/55 open:motion-safe:animate-fade-in m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] rounded-2xl p-0 shadow-[0_24px_60px_-12px_rgba(24,36,66,0.45)] backdrop:backdrop-blur-[2px] ${
        { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" }[size]
      }`}
    >
      {open && (
        <div className="px-6 pt-6 pb-6 sm:px-8 sm:pt-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 [overflow-wrap:anywhere]">
              <h2
                id={titleId}
                className="text-navy font-serif text-2xl font-medium"
              >
                {title}
              </h2>
              {description && (
                <p className="text-muted mt-1 text-sm">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-muted hover:bg-surface-muted hover:text-foreground focus-visible:ring-primary-light -mt-1 -mr-2 flex size-9 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <div className="mt-6">{children}</div>
        </div>
      )}
    </dialog>
  );
}
