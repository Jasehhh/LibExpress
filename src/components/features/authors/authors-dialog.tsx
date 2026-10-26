"use client";

import { type TRPCClientErrorLike } from "@trpc/client";
import { useId, useState } from "react";

import {
  ACTION_ICONS,
  IconButton,
  SearchInput,
} from "~/components/ui/data-table";
import { Dialog } from "~/components/ui/dialog";
import {
  BUTTON_CLASS,
  FormField,
  INPUT_CLASS,
} from "~/components/ui/form-field";
import { authorInput } from "~/lib/schemas/author";
import { type Author } from "~/lib/types";
import { type AppRouter } from "~/server/api/root";
import { api } from "~/trpc/react";

type FieldName = "firstName" | "lastName";
type FieldErrors = Partial<Record<FieldName, string>>;

const firstErrors = (fieldErrors: Record<string, string[] | undefined>) =>
  Object.fromEntries(
    Object.entries(fieldErrors).map(([field, messages]) => [
      field,
      messages?.[0],
    ]),
  ) as FieldErrors;

const fullName = (author: { firstName: string; lastName: string }) =>
  `${author.firstName} ${author.lastName}`;

const normalize = (name: string) =>
  name.trim().replace(/\s+/g, " ").toLowerCase();

const bookCount = (books: number) =>
  books === 0 ? "No books yet" : books === 1 ? "1 book" : `${books} books`;

export function AuthorsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Authors"
      description="Books pick their authors from this list."
    >
      <AuthorManager />
    </Dialog>
  );
}

function AuthorManager() {
  const [authors] = api.author.getAll.useSuspenseQuery();
  const [editing, setEditing] = useState<Author | null>(null);
  const [deleting, setDeleting] = useState<Author | null>(null);
  const [query, setQuery] = useState("");

  const needle = normalize(query);
  const shown = needle
    ? authors.filter((author) => normalize(fullName(author)).includes(needle))
    : authors;

  return (
    <>
      {/* Keyed so switching between authors starts the form fresh. */}
      <AuthorForm
        key={editing?.id ?? "new"}
        authors={authors}
        author={editing}
        onDone={() => setEditing(null)}
      />

      <div className="border-border mt-6 border-t pt-5">
        <SearchInput
          id="author-filter"
          label="Search authors"
          value={query}
          onChange={setQuery}
          placeholder={`Search ${authors.length} ${authors.length === 1 ? "author" : "authors"}`}
        />

        {shown.length > 0 ? (
          <ul className="border-border divide-border mt-3 max-h-72 divide-y overflow-y-auto rounded-xl border">
            {shown.map((author) =>
              deleting?.id === author.id ? (
                <DeleteRow
                  key={author.id}
                  author={author}
                  onDone={() => setDeleting(null)}
                />
              ) : (
                <li
                  key={author.id}
                  className={`flex items-center gap-3 px-4 py-2.5 ${
                    editing?.id === author.id ? "bg-navy-light/60" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-sm font-semibold">
                      {fullName(author)}
                    </p>
                    <p className="text-muted text-xs">
                      {bookCount(author._count.books)}
                    </p>
                  </div>
                  <IconButton
                    label={`Edit ${fullName(author)}`}
                    onClick={() => {
                      setDeleting(null);
                      setEditing(author);
                    }}
                  >
                    {ACTION_ICONS.edit}
                  </IconButton>
                  <IconButton
                    label={`Delete ${fullName(author)}`}
                    onClick={() => {
                      setEditing(null);
                      setDeleting(author);
                    }}
                    danger
                  >
                    {ACTION_ICONS.delete}
                  </IconButton>
                </li>
              ),
            )}
          </ul>
        ) : (
          <p className="text-muted mt-3 rounded-xl border border-dashed px-4 py-8 text-center text-sm">
            {authors.length === 0
              ? "No authors yet. Add the first one above."
              : "No author matches that name."}
          </p>
        )}
      </div>
    </>
  );
}

function AuthorForm({
  authors,
  author,
  onDone,
}: {
  authors: Author[];
  author: Author | null;
  onDone: () => void;
}) {
  const ids = useId();
  const utils = api.useUtils();
  const [firstName, setFirstName] = useState(author?.firstName ?? "");
  const [lastName, setLastName] = useState(author?.lastName ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const onSaved = async () => {
    // Book rows and the dashboard show author names too.
    await Promise.all([
      utils.author.getAll.invalidate(),
      utils.book.getAll.invalidate(),
      utils.dashboard.invalidate(),
    ]);
    setFirstName("");
    setLastName("");
    onDone();
  };
  const onFailed = (err: TRPCClientErrorLike<AppRouter>) => {
    const fieldErrors = err.data?.zodError?.fieldErrors;
    if (fieldErrors) setErrors(firstErrors(fieldErrors));
    else setFormError(err.message);
  };
  const create = api.author.create.useMutation({
    onSuccess: onSaved,
    onError: onFailed,
  });
  const update = api.author.update.useMutation({
    onSuccess: onSaved,
    onError: onFailed,
  });
  const saving = create.isPending || update.isPending;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const parsed = authorInput.safeParse({
      firstName: firstName.trim().replace(/\s+/g, " "),
      lastName: lastName.trim().replace(/\s+/g, " "),
    });
    if (!parsed.success) {
      setErrors(firstErrors(parsed.error.flatten().fieldErrors));
      return;
    }
    setErrors({});

    const name = normalize(fullName(parsed.data));
    const taken = authors.find(
      (other) => other.id !== author?.id && normalize(fullName(other)) === name,
    );
    if (taken) {
      setFormError(`${fullName(taken)} is already in the author list.`);
      return;
    }

    if (!author) create.mutate(parsed.data);
    else if (fullName(author) === fullName(parsed.data)) onDone();
    else update.mutate({ id: author.id, data: parsed.data });
  }

  const field = (name: FieldName) => ({
    id: `${ids}-${name}`,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${ids}-${name}-error` : undefined,
  });

  return (
    <form onSubmit={handleSubmit} noValidate>
      <p className="text-navy mb-3 text-sm font-semibold">
        {author ? `Editing ${fullName(author)}` : "Add an author"}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="First name"
          htmlFor={`${ids}-firstName`}
          error={errors.firstName}
        >
          <input
            {...field("firstName")}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            autoComplete="off"
            className={`${INPUT_CLASS} h-10`}
          />
        </FormField>
        <FormField
          label="Last name"
          htmlFor={`${ids}-lastName`}
          error={errors.lastName}
        >
          <input
            {...field("lastName")}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            autoComplete="off"
            className={`${INPUT_CLASS} h-10`}
          />
        </FormField>
      </div>

      {formError && (
        <p
          role="alert"
          className="bg-danger-light text-danger mt-4 rounded-lg px-3 py-2 text-sm"
        >
          {formError}
        </p>
      )}

      <div className="mt-4 flex justify-end gap-3">
        {author && (
          <button
            type="button"
            onClick={onDone}
            className={BUTTON_CLASS.secondary}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className={BUTTON_CLASS.primary}
        >
          {saving ? "Saving…" : author ? "Save changes" : "Add author"}
        </button>
      </div>
    </form>
  );
}

// The row turns into its own confirm, so deleting never opens a second modal.
function DeleteRow({ author, onDone }: { author: Author; onDone: () => void }) {
  const utils = api.useUtils();
  const remove = api.author.delete.useMutation({
    onSuccess: async () => {
      await utils.author.getAll.invalidate();
      onDone();
    },
  });
  const books = author._count.books;

  return (
    <li className="bg-danger-light/50 px-4 py-3">
      <p className="text-sm">
        {books > 0 ? (
          <>
            <span className="font-semibold">{fullName(author)}</span> still has{" "}
            {bookCount(books).toLowerCase()} in the catalog. Change or delete
            those books first.
          </>
        ) : (
          <>
            Delete <span className="font-semibold">{fullName(author)}</span>?
            This can&apos;t be undone.
          </>
        )}
      </p>
      {remove.error && (
        <p role="alert" className="text-danger mt-1 text-sm">
          {remove.error.message}
        </p>
      )}
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className={`${BUTTON_CLASS.secondary} bg-surface py-1.5`}
        >
          {books > 0 ? "OK" : "Cancel"}
        </button>
        {books === 0 && (
          <button
            type="button"
            onClick={() => remove.mutate({ id: author.id })}
            disabled={remove.isPending}
            className={`${BUTTON_CLASS.danger} py-1.5`}
          >
            {remove.isPending ? "Deleting…" : "Delete"}
          </button>
        )}
      </div>
    </li>
  );
}
