import { z } from "zod";

export const authInput = z.object({
  email: z.string().email("Must be a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});
