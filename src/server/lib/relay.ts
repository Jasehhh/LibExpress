import { env } from "~/env";

interface RelayResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const authHeaders = (): Record<string, string> =>
  env.RELAY_API_KEY ? { Authorization: `Bearer ${env.RELAY_API_KEY}` } : {};

export async function uploadToRelay(file: File) {
  const formData = new FormData();
  formData.append("file", file, file.name);

  const response = await fetch(`${env.RELAY_URL}/api/files/upload`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  return (await response.json()) as RelayResult<{ id: string }>;
}

export async function getFileUrl(fileId: string) {
  const response = await fetch(
    `${env.RELAY_URL}/api/files/download/${fileId}`,
  );
  const result = (await response.json()) as RelayResult<{ url: string }>;
  return result.success ? (result.data?.url ?? null) : null;
}
