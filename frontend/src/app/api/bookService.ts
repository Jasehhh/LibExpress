import { apiFetch } from "@/lib/client";
import { Book, PatchBookDTO, PostBookDTO } from "@/lib/types/book";

export const fetchBooks = async (): Promise<Book[]> => {
  const response = await apiFetch("/book", {});
  if (!response.ok) throw new Error("Fetching books failed.");
  return response.json();
};

export const postBooks = async (
  data: PostBookDTO,
  token: string,
): Promise<Book> => {
  const response = await apiFetch(
    "/book",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  );

  if (!response.ok) throw new Error("Invalid credentials.");
  return response.json();
};

export const patchBook = async (
  id: string,
  data: PatchBookDTO,
  token: string,
): Promise<Book> => {
  const response = await apiFetch(
    `/book/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
    token,
  );

  if (!response.ok) throw new Error("Failed to update book.");
  return response.json();
};

export const deleteBook = async (id: string, token: string): Promise<Book> => {
  const response = await apiFetch(`/book/${id}`, { method: "DELETE" }, token);
  if (!response.ok) throw new Error("Failed to delete book.");
  return response.json();
};
