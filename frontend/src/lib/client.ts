const BACKEND_URL = process.env.BACKEND_URL;

// Fired when the backend rejects the stored token (401 or 403 from
// authMiddleware). The auth store listens for it and signs the user out.
export const UNAUTHORIZED_EVENT = "libexpress:unauthorized";

export interface ApiErrorDetail {
  path: string;
  message: string;
}

// Mirrors the backend error body: { error } or, for Zod validation,
// { error: "Validation failed.", details: [{ path, message }] }.
export class ApiError extends Error {
  status: number;
  details: ApiErrorDetail[];

  constructor(status: number, message: string, details: ApiErrorDetail[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }

  // Field errors keyed by path, for showing next to form inputs.
  get fieldErrors(): Record<string, string> {
    return Object.fromEntries(this.details.map((d) => [d.path, d.message]));
  }
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  token?: string,
) {
  // FormData uploads set their own multipart Content-Type.
  const isJson = typeof options.body === "string";

  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}${path}`, {
      ...options,
      headers: {
        ...(isJson ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      0,
      "Can't reach the library server. Check your connection and that the backend is running.",
    );
  }

  if (
    token &&
    (response.status === 401 || response.status === 403) &&
    typeof window !== "undefined"
  ) {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }

  return response;
}

// Parses a JSON response, throwing an ApiError with the backend's message
// when the request failed.
export async function readJson<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    let message = typeof body?.error === "string" ? body.error : fallbackMessage;
    // Raw Postgres errors reach us as 500s; translate the common one.
    if (message.includes("violates foreign key constraint")) {
      message = "This record is linked to past loans or fines, so it can't be removed.";
    }
    throw new ApiError(
      response.status,
      message,
      Array.isArray(body?.details) ? body.details : [],
    );
  }
  return body as T;
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}
