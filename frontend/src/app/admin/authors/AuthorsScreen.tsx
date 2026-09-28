"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { deleteAuthor, fetchAuthors, patchAuthor, postAuthor } from "@/app/api/authorService";
import { fetchBooks } from "@/app/api/bookService";
import { useStaff } from "@/components/admin/StaffShell";
import { Button } from "@/components/ui/Button";
import { PageHeader, SearchBox } from "@/components/ui/Controls";
import { ConfirmDialog, Dialog, DialogActions } from "@/components/ui/Dialog";
import { FormError, TextField } from "@/components/ui/Field";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { Table, TBody, Td, Th, THead } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { ApiError, errorMessage } from "@/lib/client";
import { fullName, plural } from "@/lib/format";
import { authorBodySchema, authorPatchSchema } from "@/lib/schemas/author";
import { validate } from "@/lib/schemas/validate";
import { useQuery } from "@/lib/useQuery";
import { Author, PatchAuthorDTO } from "@/lib/types/author";

export function AuthorsScreen() {
  const { token } = useStaff();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Author | "new" | null>(null);
  const [removing, setRemoving] = useState<Author | null>(null);

  const load = useCallback(
    () => Promise.all([fetchAuthors(), fetchBooks()]).then(([authors, books]) => ({ authors, books })),
    [],
  );
  const { data, error, reload } = useQuery(load);

  const titles = useMemo(() => {
    const byAuthor = new Map<string, string[]>();
    for (const book of data?.books ?? []) {
      byAuthor.set(book.author_id, [...(byAuthor.get(book.author_id) ?? []), book.title]);
    }
    return byAuthor;
  }, [data]);

  const authors = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (data?.authors ?? []).filter((author) => !needle || fullName(author).toLowerCase().includes(needle));
  }, [data, query]);

  return (
    <>
      <PageHeader
        title="Authors"
        description="Every book in the catalogue is linked to one author."
        actions={
          <Button onClick={() => setEditing("new")} disabled={!data}>
            Add author
          </Button>
        }
      />

      {error && !data && <ErrorState message={error.message} onRetry={reload} />}
      {!data && !error && <LoadingState label="Loading authors" />}

      {data && (
        <>
          <SearchBox value={query} onChange={setQuery} label="Search authors" placeholder="Search by name" className="mb-5 md:w-80" />

          {data.authors.length === 0 ? (
            <EmptyState title="No authors yet" action={<Button onClick={() => setEditing("new")}>Add an author</Button>}>
              Add authors before adding their books.
            </EmptyState>
          ) : authors.length === 0 ? (
            <EmptyState title="No authors match">Check the spelling or try part of the name.</EmptyState>
          ) : (
            <Table label="Authors">
              <THead>
                <Th>Name</Th>
                <Th>Books in the catalogue</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </THead>
              <TBody>
                {authors.map((author) => {
                  const books = titles.get(author.id) ?? [];
                  return (
                    <tr key={author.id} className="hover:bg-paper/60">
                      <Td className="font-semibold">
                        {author.last_name}, {author.first_name}
                      </Td>
                      <Td className="text-ink-soft">
                        {books.length === 0 ? (
                          "None"
                        ) : (
                          <span title={books.join("\n")}>
                            {plural(books.length, "book")}
                            <span className="hidden text-ink-faint lg:inline">
                              {" "}
                              ({books.slice(0, 2).join(", ")}
                              {books.length > 2 ? ", …" : ""})
                            </span>
                          </span>
                        )}
                      </Td>
                      <Td className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="sm" onClick={() => setEditing(author)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost-danger"
                          size="sm"
                          onClick={() => setRemoving(author)}
                          disabled={books.length > 0}
                          title={books.length > 0 ? "Remove or reassign this author's books first" : undefined}
                        >
                          Remove
                        </Button>
                      </Td>
                    </tr>
                  );
                })}
              </TBody>
            </Table>
          )}

          <Dialog open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Add an author" : "Edit author"}>
            {editing !== null && (
              <AuthorForm
                author={editing === "new" ? undefined : editing}
                token={token}
                onCancel={() => setEditing(null)}
                onSaved={(saved) => {
                  toast(editing === "new" ? `Added ${fullName(saved)}` : `Saved ${fullName(saved)}`);
                  setEditing(null);
                  reload();
                }}
              />
            )}
          </Dialog>

          <ConfirmDialog
            open={removing !== null}
            onClose={() => setRemoving(null)}
            title={`Remove ${removing ? fullName(removing) : "author"}?`}
            confirmLabel="Remove author"
            onConfirm={async () => {
              if (!removing) return;
              await deleteAuthor(removing.id, token);
              toast(`Removed ${fullName(removing)}`);
              reload();
            }}
          >
            This author has no books in the catalogue, so nothing else changes.
          </ConfirmDialog>
        </>
      )}
    </>
  );
}

function AuthorForm({
  author,
  token,
  onCancel,
  onSaved,
}: {
  author?: Author;
  token: string;
  onCancel: () => void;
  onSaved: (author: Author) => void;
}) {
  const [firstName, setFirstName] = useState(author?.first_name ?? "");
  const [lastName, setLastName] = useState(author?.last_name ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const values = { first_name: firstName.trim(), last_name: lastName.trim() };
    const checked = validate(authorBodySchema, values);
    if (checked.errors) {
      setErrors(checked.errors);
      return;
    }
    setErrors({});
    setFormError(null);
    setBusy(true);
    try {
      if (author) {
        const changes: PatchAuthorDTO = {};
        if (values.first_name !== author.first_name) changes.first_name = values.first_name;
        if (values.last_name !== author.last_name) changes.last_name = values.last_name;
        if (validate(authorPatchSchema, changes).errors) {
          onCancel();
          return;
        }
        onSaved(await patchAuthor(author.id, changes, token));
      } else {
        onSaved(await postAuthor(values, token));
      }
    } catch (err) {
      setFormError(errorMessage(err));
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} error={errors.first_name} autoFocus required />
        <TextField label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} error={errors.last_name} required />
      </div>
      <div className="mt-5">
        <FormError message={formError} />
      </div>
      <DialogActions>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" busy={busy}>
          {author ? "Save changes" : "Add author"}
        </Button>
      </DialogActions>
    </form>
  );
}
