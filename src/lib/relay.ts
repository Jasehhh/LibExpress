// Client side: upload a cover image, then pass the url to book.create or
// book.update. The session cookie signs the request.
export const uploadImage = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/relay/upload", {
    method: "POST",
    body: formData,
  });
  const result = (await response.json()) as { url?: string; error?: string };

  if (!response.ok || !result.url) {
    throw new Error(result.error ?? "Upload failed.");
  }
  return { url: result.url };
};
