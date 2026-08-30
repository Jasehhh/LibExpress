export interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  url: string | null;
  genre: BookGenre;
  total_copies: number;
  available_copies: number;
  created_at: Date;
}

type BookGenre =
  | "FANTASY"
  | "SCIFI"
  | "HORROR"
  | "ROMANCE"
  | "MYSTERY"
  | "THRILLER"
  | "ADVENTURE"
  | "DRAMA"
  | "COMEDY"
  | "OTHERS";
