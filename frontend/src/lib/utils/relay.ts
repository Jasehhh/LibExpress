import { postBooks } from "@/app/api/bookService";

const BACKEND_URL = process.env.BACKEND_URL;

export const uploadImage = async (file: File): Promise<{ id: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BACKEND_URL}/api/relay/upload`, {
    method: "POST",
    body: formData,
    // include your auth header/cookie here the same way postBooks does, if needed
  });

  const result = await response.json();

  if (!response.ok) throw new Error(result.error ?? "Upload failed.");

  return { id: result.id };
};

export const handleAddBook = async (
  file: File,
  bookData: Omit<Parameters<typeof postBooks>[0], "file_id">,
) => {
  const { id } = await uploadImage(file);
  return postBooks({ ...bookData, file_id: id });
};
