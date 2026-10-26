export const TIME_ZONE = "Asia/Manila";

const UTC_OFFSET_MS = 8 * 60 * 60 * 1000;

const inManila = (date: Date) => new Date(date.getTime() + UTC_OFFSET_MS);

const fromManila = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month, day) - UTC_OFFSET_MS);

export const startOfDay = (date: Date, addDays = 0) => {
  const local = inManila(date);
  return fromManila(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate() + addDays,
  );
};

export const startOfMonth = (date: Date, addMonths = 0) => {
  const local = inManila(date);
  return fromManila(local.getUTCFullYear(), local.getUTCMonth() + addMonths, 1);
};
