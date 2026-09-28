import { apiFetch, readJson } from "@/lib/client";
import { Author, PatchAuthorDTO, PostAuthorDTO } from "@/lib/types/author";

export const fetchAuthors = async (): Promise<Author[]> => {
  const response = await apiFetch("/author", {});
  return readJson(response, "Fetching authors failed.");
};

export const fetchAuthor = async (id: string): Promise<Author> => {
  const response = await apiFetch(`/author/${id}`, {});
  return readJson(response, "Fetching author failed.");
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

  return readJson(response, "Failed to create an author.");
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

  return readJson(response, "Failed to update author.");
};

export const deleteAuthor = async (
  id: string,
  token: string,
): Promise<Author> => {
  const response = await apiFetch(`/author/${id}`, { method: "DELETE" }, token);
  return readJson(response, "Failed to delete author.");
};
