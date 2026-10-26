"use client";

import { type TRPCClientErrorLike } from "@trpc/client";
import Image from "next/image";
import { useId, useState } from "react";

import { AuthorPicker } from "~/components/features/authors/author-picker";
import { GENRE_LABELS } from "~/components/features/books/genre-labels";
import { Dialog } from "~/components/ui/dialog";
import {
  BUTTON_CLASS,
  FormField,
  INPUT_CLASS,
} from "~/components/ui/form-field";
import { changedFields } from "~/lib/changes";
import { uploadImage } from "~/lib/relay";
import { BOOK_GENRES, bookInput } from "~/lib/schemas/book";
import { type AuthorChoice, type Book, type BookGenre } from "~/lib/types";
import { type AppRouter } from "~/server/api/root";
import { api } from "~/trpc/react";

type FieldName =
  | "title"
  | "isbn"
  | "genre"
  | "authorIds"
  | "totalCopies"
  | "description"
  | "url";
type FieldErrors = Partial<Record<FieldName, string>>;

const firstErrors = (fieldErrors: Record<string, string[] | undefined>) =>
  Object.fromEntries(
    Object.entries(fieldErrors).map(([field, messages]) => [
      field,
      messages?.[0],
    ]),
  ) as FieldErrors;

export function BookFormDialog({
  open,
  book,
  onClose,
}: {
  open: boolean;
  book: Book | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={book ? "Edit book" : "Add a book"}
      description={
        book
          ? "Changes show in the public catalog as soon as you save."
          : "The book shows in the public catalog as soon as you add it."
      }
    >
      <BookForm book={book} onDone={onClose} />
    </Dialog>
  );
}

function BookForm({ book, onDone }: { book: Book | null; onDone: () => void }) {
  const ids = useId();
  const utils = api.useUtils();

  const [title, setTitle] = useState(book?.title ?? "");
  const [isbn, setIsbn] = useState(book?.isbn ?? "");
  const [genre, setGenre] = useState<BookGenre | "">(book?.genre ?? "");
  const [authors, setAuthors] = useState<AuthorChoice[]>(book?.authors ?? []);
  const [copies, setCopies] = useState(String(book?.totalCopies ?? 1));
  const [description, setDescription] = useState(book?.description ?? "");
  const [url, setUrl] = useState(book?.url ?? "");
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const onSaved = async () => {
    await Promise.all([
      utils.book.getAll.invalidate(),
      utils.author.getAll.invalidate(),
      utils.loan.getOpen.invalidate(),
      utils.dashboard.invalidate(),
    ]);
    onDone();
  };
  const onFailed = (err: TRPCClientErrorLike<AppRouter>) => {
    const zodError = err.data?.zodError;
    if (zodError && Object.keys(zodError.fieldErrors).length > 0) {
      setErrors(firstErrors(zodError.fieldErrors));
    } else {
      setFormError(zodError?.formErrors[0] ?? err.message);
    }
  };
  const create = api.book.create.useMutation({
    onSuccess: onSaved,
    onError: onFailed,
  });
  const update = api.book.update.useMutation({
    onSuccess: onSaved,
    onError: onFailed,
  });
  const saving = create.isPending || update.isPending;

  async function handleCover(file: File | undefined) {
    if (!file) return;
    setErrors((current) => ({ ...current, url: undefined }));
    setUploading(true);
    try {
      setUrl((await uploadImage(file)).url);
    } catch (err) {
      setErrors((current) => ({ ...current, url: (err as Error).message }));
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!genre) {
      setErrors({ genre: "Pick a genre." });
      return;
    }
    if (!copies.trim()) {
      setErrors({ totalCopies: "Enter how many copies." });
      return;
    }
    const parsed = bookInput.safeParse({
      title: title.trim(),
      isbn: isbn.replace(/[\s-]/g, ""),
      genre,
      authorIds: authors.map((author) => author.id),
      totalCopies: Number(copies),
      description: description.trim() || undefined,
      url: url || undefined,
    });
    if (!parsed.success) {
      setErrors(firstErrors(parsed.error.flatten().fieldErrors));
      return;
    }
    setErrors({});

    if (!book) {
      create.mutate(parsed.data);
      return;
    }
    const data = changedFields(
      {
        ...book,
        authorIds: book.authors.map((author) => author.id),
        newAuthors: [],
        description: book.description ?? "",
        url: book.url ?? undefined,
      },
      { ...parsed.data, description: description.trim() },
    );
    if (Object.keys(data).length === 0) onDone();
    else update.mutate({ id: book.id, data });
  }

  const field = (name: FieldName) => ({
    id: `${ids}-${name}`,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${ids}-${name}-error` : undefined,
  });

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-6 sm:grid-cols-[9rem_minmax(0,1fr)]">
        <div>
          <p className="text-foreground mb-1.5 text-sm font-medium">Cover</p>
          <div className="border-border bg-surface-muted relative aspect-[2/3] w-36 overflow-hidden rounded-md border">
            {url ? (
              <Image
                src={url}
                alt="Cover preview"
                fill
                sizes="9rem"
                unoptimized
                className="object-cover"
              />
            ) : (
              <p className="text-muted flex h-full items-center justify-center px-4 text-center text-xs">
                No cover yet. Books without one get a plain spine colour.
              </p>
            )}
            {uploading && (
              <p className="bg-navy/70 absolute inset-0 flex items-center justify-center text-sm font-medium text-white">
                Uploading…
              </p>
            )}
          </div>
          <label
            className={`${BUTTON_CLASS.secondary} mt-3 w-36 cursor-pointer focus-within:ring-2`}
          >
            {url ? "Replace cover" : "Upload cover"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploading}
              onChange={(event) => void handleCover(event.target.files?.[0])}
            />
          </label>
          {errors.url && (
            <p className="text-danger mt-1.5 w-36 text-sm">{errors.url}</p>
          )}
        </div>

        <div className="grid content-start gap-5">
          <FormField
            label="Title"
            htmlFor={`${ids}-title`}
            error={errors.title}
          >
            <input
              {...field("title")}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={`${INPUT_CLASS} h-10`}
            />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="ISBN"
              htmlFor={`${ids}-isbn`}
              hint="10 or 13 digits. Dashes are fine."
              error={errors.isbn}
            >
              <input
                {...field("isbn")}
                value={isbn}
                onChange={(event) => setIsbn(event.target.value)}
                inputMode="numeric"
                className={`${INPUT_CLASS} h-10 tabular-nums`}
              />
            </FormField>
            <FormField
              label="Genre"
              htmlFor={`${ids}-genre`}
              error={errors.genre}
            >
              <select
                {...field("genre")}
                value={genre}
                onChange={(event) => setGenre(event.target.value as BookGenre)}
                className={`${INPUT_CLASS} h-10`}
              >
                <option value="" disabled>
                  Pick a genre
                </option>
                {BOOK_GENRES.map((g) => (
                  <option key={g} value={g}>
                    {GENRE_LABELS[g]}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField
            label="Authors"
            htmlFor={`${ids}-authorIds`}
            hint="Pick from the author list. Missing someone? Add them under Authors."
            error={errors.authorIds}
          >
            <AuthorPicker
              id={`${ids}-authorIds`}
              selected={authors}
              onChange={setAuthors}
              error={errors.authorIds}
            />
          </FormField>

          <FormField
            label="Copies"
            htmlFor={`${ids}-totalCopies`}
            hint={
              book
                ? `${book.totalCopies - book.availableCopies} on loan now. You can't go below that.`
                : "How many copies go on the shelf."
            }
            error={errors.totalCopies}
          >
            <input
              {...field("totalCopies")}
              type="number"
              min={0}
              step={1}
              value={copies}
              onChange={(event) => setCopies(event.target.value)}
              className={`${INPUT_CLASS} h-10 w-28 tabular-nums`}
            />
          </FormField>

          <FormField
            label="Description"
            htmlFor={`${ids}-description`}
            hint="Optional. Shown on the book's page."
            error={errors.description}
          >
            <textarea
              {...field("description")}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className={`${INPUT_CLASS} resize-y py-2 leading-relaxed`}
            />
          </FormField>
        </div>
      </div>

      {formError && (
        <p
          role="alert"
          className="bg-danger-light text-danger mt-6 rounded-lg px-3 py-2 text-sm"
        >
          {formError}
        </p>
      )}

      <div className="border-border mt-7 flex justify-end gap-3 border-t pt-5">
        <button
          type="button"
          onClick={onDone}
          className={BUTTON_CLASS.secondary}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || uploading}
          className={BUTTON_CLASS.primary}
        >
          {saving ? "Saving…" : book ? "Save changes" : "Add book"}
        </button>
      </div>
    </form>
  );
}
