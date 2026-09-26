import { postBooks } from "@/app/api/bookService";

const BACKEND_URL = process.env.BACKEND_URL;

export const uploadImage = async (
  file: File,
  token: string,
): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BACKEND_URL}/relay/upload`, {
    method: "POST",
    body: formData,
    headers: { Authorization: `Bearer ${token}` },
  });

  const result = await response.json();

  if (!response.ok) throw new Error(result.error ?? "Upload failed.");

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
