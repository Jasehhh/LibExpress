import { apiFetch, readJson } from "@/lib/client";
import { Book, BookRecord, PatchBookDTO, PostBookDTO } from "@/lib/types/book";

export const fetchBooks = async (): Promise<Book[]> => {
  const response = await apiFetch("/book", {});
  return readJson(response, "Fetching books failed.");
};

export const fetchBook = async (id: string): Promise<Book> => {
  const response = await apiFetch(`/book/${id}`, {});
  return readJson(response, "Fetching book failed.");
};

export const postBooks = async (
  data: PostBookDTO,
  token: string,
): Promise<BookRecord> => {
  const response = await apiFetch(
    "/book",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  );

  return readJson(response, "Failed to create a book.");
};

export const patchBook = async (
  id: string,
  data: PatchBookDTO,
  token: string,
): Promise<BookRecord> => {
  const response = await apiFetch(
    `/book/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
    token,
  );

  return readJson(response, "Failed to update book.");
};

export const deleteBook = async (
  id: string,
  token: string,
): Promise<BookRecord> => {
  const response = await apiFetch(`/book/${id}`, { method: "DELETE" }, token);
  return readJson(response, "Failed to delete book.");
};
