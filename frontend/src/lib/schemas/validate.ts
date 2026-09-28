import z, { ZodType } from "zod";

// Same shape as the backend's validationError details, keyed by path,
// so forms can show errors before the request is sent.
export function validate<T>(
  schema: ZodType<T>,
  data: unknown,
): { data: T; errors: null } | { data: null; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  if (result.success) return { data: result.data, errors: null };

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".") || "form";
    errors[path] ??= issue.message;
  }
  return { data: null, errors };
}

// Route ids are UUIDs; anything else would make Postgres throw a 500.
export function isUuid(value: string) {
  return z.uuid().safeParse(value).success;
}
