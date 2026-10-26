export const changedFields = <T extends Record<string, unknown>>(
  original: Record<string, unknown>,
  next: T,
) =>
  Object.fromEntries(
    Object.entries(next).filter(
      ([key, value]) => JSON.stringify(value) !== JSON.stringify(original[key]),
    ),
  ) as Partial<T>;
