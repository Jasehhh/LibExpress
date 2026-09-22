const BACKEND_URL = process.env.BACKEND_URL;

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  token?: string,
) {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  return response;
}
