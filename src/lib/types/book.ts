export interface Book {
  isbn: string;
  title: string;
  author: string;
  genre: BookGenre;
  total_copies: number;
  available_copies: number;
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
