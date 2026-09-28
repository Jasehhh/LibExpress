"use client";

import { ReactNode, useEffect, useId, useRef, useState } from "react";
import { Button } from "./Button";
import { FormError } from "./Field";
import { errorMessage } from "@/lib/client";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  size?: "md" | "lg";
}

// Native <dialog> gives focus trapping, Escape to close and inert background.
// Children only render while open, so forms start fresh each time.
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
}: DialogProps) {
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
      onClose={onClose}
      aria-labelledby={titleId}
      className={`m-auto w-[calc(100%-2rem)] ${size === "lg" ? "max-w-2xl" : "max-w-lg"} max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-lg border border-rule bg-surface p-0 text-ink shadow-[0_24px_48px_-12px_rgb(28_34_48/0.35)]`}
    >
      {open && (
        <div className="p-6 sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 id={titleId} className="font-serif text-2xl font-semibold leading-tight">
                {title}
              </h2>
              {description && (
                <div className="mt-1.5 text-[0.9375rem] text-ink-soft">{description}</div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 -mt-1 rounded-md p-2 text-ink-soft hover:bg-ink/5 hover:text-ink"
              aria-label="Close"
            >
              <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

export function DialogActions({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      {children}
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
}

export function ConfirmDialog({
  open,
  onClose,
  title,
  children,
  confirmLabel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <ConfirmBody onClose={onClose} confirmLabel={confirmLabel} onConfirm={onConfirm}>
        {children}
      </ConfirmBody>
    </Dialog>
  );
}

function ConfirmBody({
  onClose,
  confirmLabel,
  onConfirm,
  children,
}: Omit<ConfirmDialogProps, "open" | "title">) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <>
      <div className="text-[0.9375rem] leading-relaxed text-ink-soft">{children}</div>
      <div className="mt-4">
        <FormError message={error} />
      </div>
      <DialogActions>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" onClick={confirm} busy={busy}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </>
  );
}
