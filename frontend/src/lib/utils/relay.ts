import { postBooks } from "@/app/api/bookService";
import { apiFetch, readJson } from "@/lib/client";

export const uploadImage = async (
  file: File,
  token: string,
): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiFetch(
    "/relay/upload",
    { method: "POST", body: formData },
    token,
  );

  const result = await readJson<{ url: string }>(response, "Upload failed.");
  return { url: result.url };
};

export const handleAddBook = async (
  file: File,
  bookData: Omit<Parameters<typeof postBooks>[0], "url">,
  token: string,
) => {
  const { url } = await uploadImage(file, token);
  return postBooks({ ...bookData, url }, token);
};
