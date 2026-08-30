import z from "zod";

export const authBodySchema = z.object({
  email: z.email("Must be a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});
