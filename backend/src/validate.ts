import { Request, Response, NextFunction } from "express";
import { ZodError, ZodType } from "zod";

export const validationError = (error: ZodError) => ({
  error: "Validation failed.",
  details: error.issues.map((e) => ({
    path: e.path.join("."),
    message: e.message,
  })),
});

export const validateResource =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json(validationError(result.error));
    }
    next();
  };
