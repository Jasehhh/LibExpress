import z from "zod";

export const updateMemberSchema = z
  .object({
    email: z.email("Email must be a valid email."),
    full_name: z.string().min(4, "Full Name must be at least 4 characters."),
    role: z.enum(["USER", "ADMIN"]).default("USER"),
    status: z.enum(["ACTIVE", "SUSPENDED"]).default("ACTIVE"),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });

export const createMemberSchema = z.object({
  email: z.email("Email must be a valid email."),
  full_name: z.string().min(4, "Full Name must be at least 4 characters."),
});
