import { BookGenre } from "@/lib/types/book";

const LOCALE = "en-PH";
const CURRENCY = "PHP";

export const GENRES: BookGenre[] = [
  "FANTASY",
  "SCIFI",
  "HORROR",
  "ROMANCE",
  "MYSTERY",
  "THRILLER",
  "ADVENTURE",
  "DRAMA",
  "COMEDY",
  "OTHERS",
];

const GENRE_LABELS: Record<BookGenre, string> = {
  FANTASY: "Fantasy",
  SCIFI: "Science fiction",
  HORROR: "Horror",
  ROMANCE: "Romance",
  MYSTERY: "Mystery",
  THRILLER: "Thriller",
  ADVENTURE: "Adventure",
  DRAMA: "Drama",
  COMEDY: "Comedy",
  OTHERS: "Other",
};

export function genreLabel(genre: string): string {
  return GENRE_LABELS[genre as BookGenre] ?? genre;
}

export function fullName(person: { first_name: string; last_name: string }) {
  return `${person.first_name} ${person.last_name}`;
}

const dateFormat = new Intl.DateTimeFormat(LOCALE, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const moneyFormat = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
});

export function formatDate(value: string | Date) {
  return dateFormat.format(new Date(value));
}

export function formatDateTime(value: string | Date) {
  return dateTimeFormat.format(new Date(value));
}

// NUMERIC columns arrive as strings like "20.00".
export function formatMoney(value: string | number) {
  return moneyFormat.format(Number(value));
}

export function relativeTime(value: string, now: number) {
  const seconds = Math.round((new Date(value).getTime() - now) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ];
  const format = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) {
      return format.format(Math.round(seconds / size), unit);
    }
  }
  return "just now";
}

export function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

// Value for <input type="datetime-local"> in the browser's time zone.
export function toDateTimeLocal(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
