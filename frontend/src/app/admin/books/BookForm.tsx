"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { postAuthor } from "@/app/api/authorService";
import { patchBook, postBooks } from "@/app/api/bookService";
import { BookCover } from "@/components/catalogue/BookCover";
import { Button } from "@/components/ui/Button";
import { DialogActions } from "@/components/ui/Dialog";
import { FormError, SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { ApiError, errorMessage } from "@/lib/client";
import { fullName, genreLabel, GENRES } from "@/lib/format";
import { authorBodySchema } from "@/lib/schemas/author";
import { bookBodySchema, bookPatchSchema } from "@/lib/schemas/book";
import { validate } from "@/lib/schemas/validate";
import { Author } from "@/lib/types/author";
import { Book, BookRecord, PatchBookDTO, PostBookDTO } from "@/lib/types/book";
import { handleAddBook, uploadImage } from "@/lib/utils/relay";

interface BookFormProps {
  book?: Book;
  authors: Author[];
  token: string;
  onCancel: () => void;
  onSaved: (book: BookRecord) => void;
  onAuthorAdded: (author: Author) => void;
}

interface Values {
  title: string;
  author_id: string;
  isbn: string;
  genre: string;
  total_copies: string;
  description: string;
}

export function BookForm({ book, authors, token, onCancel, onSaved, onAuthorAdded }: BookFormProps) {
  const [values, setValues] = useState<Values>({
    title: book?.title ?? "",
    author_id: book?.author_id ?? "",
    isbn: book?.isbn ?? "",
    genre: book?.genre ?? "",
    total_copies: String(book?.total_copies ?? 1),
    description: book?.description ?? "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [addingAuthor, setAddingAuthor] = useState(false);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  function set<K extends keyof Values>(key: K) {
    return (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setValues((current) => ({ ...current, [key]: event.target.value }));
      setErrors((current) => {
        if (!current[key]) return current;
        const next = { ...current };
        delete next[key];
        return next;
      });
    };
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0] ?? null;
    if (chosen && !chosen.type.startsWith("image/")) {
      setErrors((current) => ({ ...current, url: "Choose an image file (JPG, PNG or WebP)." }));
      return;
    }
    setErrors((current) => {
      const next = { ...current };
      delete next.url;
      return next;
    });
    setFile(chosen);
    setPreview(chosen ? URL.createObjectURL(chosen) : null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const description = values.description.trim();
    const payload: PostBookDTO = {
      title: values.title.trim(),
      author_id: values.author_id,
      isbn: values.isbn.trim(),
      genre: values.genre as PostBookDTO["genre"],
      total_copies: values.total_copies === "" ? NaN : Number(values.total_copies),
      ...(description ? { description } : {}),
    };

    // The shared schema accepts any genre string and reports an empty
    // author or copies field in API terms, so add friendlier messages.
    const checked = validate(book ? bookPatchSchema : bookBodySchema, payload);
    const found: Record<string, string> = { ...checked.errors };
    if (!payload.author_id) found.author_id = "Choose an author.";
    if (!payload.genre) found.genre = "Choose a genre.";
    if (Number.isNaN(payload.total_copies)) found.total_copies = "Enter how many copies the library owns.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);

    try {
      if (book) {
        // PATCH only what changed. Clearing the description sends "".
        const changes: PatchBookDTO = {};
        if (payload.title !== book.title) changes.title = payload.title;
        if (payload.author_id !== book.author_id) changes.author_id = payload.author_id;
        if (payload.isbn !== book.isbn) changes.isbn = payload.isbn;
        if (payload.genre !== book.genre) changes.genre = payload.genre;
        if (payload.total_copies !== book.total_copies) changes.total_copies = payload.total_copies;
        if (description !== (book.description ?? "")) changes.description = description;
        if (file) changes.url = (await uploadImage(file, token)).url;

        if (Object.keys(changes).length === 0) {
          onCancel();
          return;
        }
        onSaved(await patchBook(book.id, changes, token));
      } else {
        onSaved(file ? await handleAddBook(file, payload, token) : await postBooks(payload, token));
      }
    } catch (err) {
      setFormError(errorMessage(err));
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      setBusy(false);
    }
  }

  const selectedAuthor = authors.find((a) => a.id === values.author_id);
  const sortedAuthors = [...authors].sort((a, b) =>
    `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`),
  );

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid gap-6 sm:grid-cols-[9rem_1fr]">
        <div className="flex flex-col gap-2">
          <div className="w-28 sm:w-full">
            {preview ? (
              <div className="relative aspect-[2/3] overflow-hidden rounded-[3px] shadow">
                <Image src={preview} alt="New cover preview" fill unoptimized className="object-cover" />
              </div>
            ) : (
              <BookCover
                title={values.title || "Untitled"}
                author={selectedAuthor && fullName(selectedAuthor)}
                genre={values.genre || "OTHERS"}
                url={book?.url ?? null}
              />
            )}
          </div>
          <label className="text-sm font-semibold text-stamp hover:underline">
            <input type="file" accept="image/*" onChange={chooseFile} className="sr-only" />
            <span className="cursor-pointer">{book?.url || file ? "Replace cover" : "Upload cover"}</span>
          </label>
          {errors.url && <p className="text-sm text-overdue">{errors.url}</p>}
        </div>

        <div className="flex flex-col gap-4">
          <TextField
            label="Title"
            value={values.title}
            onChange={set("title")}
            error={errors.title}
            maxLength={255}
            required
            autoFocus
          />

          {addingAuthor ? (
            <NewAuthor
              token={token}
              onCancel={() => setAddingAuthor(false)}
              onAdded={(author) => {
                onAuthorAdded(author);
                setValues((current) => ({ ...current, author_id: author.id }));
                setErrors((current) => {
                  const next = { ...current };
                  delete next.author_id;
                  return next;
                });
                setAddingAuthor(false);
              }}
            />
          ) : (
            <div>
              <SelectField label="Author" value={values.author_id} onChange={set("author_id")} error={errors.author_id} required>
                <option value="">Choose an author</option>
                {sortedAuthors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.last_name}, {author.first_name}
                  </option>
                ))}
              </SelectField>
              <button
                type="button"
                onClick={() => setAddingAuthor(true)}
                className="mt-1.5 text-sm font-semibold text-stamp hover:underline"
              >
                Author not listed? Add an author
              </button>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="ISBN"
              value={values.isbn}
              onChange={set("isbn")}
              error={errors.isbn}
              maxLength={13}
              inputMode="numeric"
              hint="5 to 13 characters"
              required
            />
            <SelectField label="Genre" value={values.genre} onChange={set("genre")} error={errors.genre} required>
              <option value="">Choose a genre</option>
              {GENRES.map((genre) => (
                <option key={genre} value={genre}>
                  {genreLabel(genre)}
                </option>
              ))}
            </SelectField>
          </div>

          <TextField
            label="Copies owned"
            type="number"
            min={book ? book.available_copies : 0}
            step={1}
            value={values.total_copies}
            onChange={set("total_copies")}
            error={errors.total_copies}
            hint={
              book
                ? `Can't be lower than the ${book.available_copies} on the shelf right now.`
                : "All copies start on the shelf."
            }
            className="sm:w-40"
            required
          />

          <TextAreaField
            label="Description"
            value={values.description}
            onChange={set("description")}
            error={errors.description}
            rows={4}
            maxLength={2000}
            hint={`Optional. ${2000 - values.description.length} characters left.`}
          />
        </div>
      </div>

      <div className="mt-5">
        <FormError message={formError} />
      </div>
      <DialogActions>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" busy={busy}>
          {book ? "Save changes" : "Add book"}
        </Button>
      </DialogActions>
    </form>
  );
}

function NewAuthor({
  token,
  onCancel,
  onAdded,
}: {
  token: string;
  onCancel: () => void;
  onAdded: (author: Author) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Not a nested <form>: this sits inside the book form.
  async function add() {
    const checked = validate(authorBodySchema, { first_name: firstName.trim(), last_name: lastName.trim() });
    if (checked.errors) {
      setErrors(checked.errors);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      onAdded(await postAuthor(checked.data, token));
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="rounded-md border border-rule bg-paper p-4">
      <p className="mb-3 text-sm font-semibold">New author</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} error={errors.first_name} autoFocus />
        <TextField label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} error={errors.last_name} />
      </div>
      <div className="mt-3">
        <FormError message={error} />
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={add} busy={busy}>
          Add author
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
