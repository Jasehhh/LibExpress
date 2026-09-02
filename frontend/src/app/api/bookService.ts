import { Book, PatchBookDTO, PostBookDTO } from "@/lib/types/book";

const BACKEND_URL = process.env.BACKEND_URL;

export const fetchBooks = async (): Promise<Book[]> => {
  const response = await fetch(`${BACKEND_URL}/api/book`);
  if (!response.ok) throw new Error("Fetching books failed.");
  return response.json();
};

export const postBooks = async (data: PostBookDTO): Promise<Book> => {
  const response = await fetch(`${BACKEND_URL}/api/book`, {
    method: "POST",
    headers: { "Content-type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error("Invalid credentials.");
  return response.json();
};

export const patchBook = async (
  id: string,
  data: PatchBookDTO,
): Promise<Book> => {
  const response = await fetch(`${BACKEND_URL}/api/book/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update book.");
  }

  return response.json();
};

export const deleteBook = async (id: string): Promise<Book> => {
  const response = await fetch(`${BACKEND_URL}/api/book/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete book.");
  }

  return response.json();
};
