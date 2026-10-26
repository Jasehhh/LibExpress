import { env } from "~/env";

interface RelayResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const authHeaders = (): Record<string, string> =>
  env.RELAY_API_KEY ? { Authorization: `Bearer ${env.RELAY_API_KEY}` } : {};

async function readRelay<T>(response: Response): Promise<RelayResult<T>> {
  const failed = `The image server answered ${response.status}.`;
  try {
    const result = (await response.json()) as RelayResult<T>;
    return response.ok
      ? result
      : { success: false, error: result.error ?? failed };
  } catch {
    return { success: false, error: failed };
  }
}

export async function uploadToRelay(file: File) {
  const formData = new FormData();
  formData.append("file", file, file.name);

  const response = await fetch(`${env.RELAY_URL}/api/files/upload`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  return readRelay<{ id: string }>(response);
}

export async function getFileUrl(fileId: string) {
  const response = await fetch(`${env.RELAY_URL}/api/files/download/${fileId}`);
  const result = await readRelay<{ url: string }>(response);
  return result.success ? (result.data?.url ?? null) : null;
}
