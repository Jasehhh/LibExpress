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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: string) => UUID.test(value);

// Router param handler: ids that are not UUIDs can't exist, so answer 404
// instead of letting Postgres fail the cast with a 500.
export const uuidParam =
  (notFound: string) =>
  (req: Request, res: Response, next: NextFunction, value: string) => {
    if (!isUuid(value)) {
      return res.status(404).json({ error: notFound });
    }
    next();
  };

// Postgres foreign_key_violation, e.g. deleting a row other rows still point to.
export const isForeignKeyViolation = (error: unknown) =>
  (error as { code?: string } | null)?.code === "23503";
