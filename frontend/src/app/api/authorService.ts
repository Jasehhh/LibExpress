import { apiFetch } from "@/lib/client";
import { Author, PatchAuthorDTO, PostAuthorDTO } from "@/lib/types/author";

export const fetchAuthors = async (): Promise<Author[]> => {
  const response = await apiFetch("/author", {});
  if (!response.ok) throw new Error("Fetching authors failed.");
  return response.json();
};

export const postAuthor = async (
  data: PostAuthorDTO,
  token: string,
): Promise<Author> => {
  const response = await apiFetch(
    "/author",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  );

  if (!response.ok) throw new Error("Failed to create an author.");
  return response.json();
};

export const patchAuthor = async (
  id: string,
  data: PatchAuthorDTO,
  token: string,
): Promise<Author> => {
  const response = await apiFetch(
    `/author/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
    token,
  );

  if (!response.ok) throw new Error("Failed to update author.");
  return response.json();
};

export const deleteAuthor = async (
  id: string,
  token: string,
): Promise<Author> => {
  const response = await apiFetch(`/author/${id}`, { method: "DELETE" }, token);
  if (!response.ok) throw new Error("Failed to delete author.");
  return response.json();
};
