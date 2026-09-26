import { Author } from "./author";

// What POST/PATCH/DELETE return: the plain row, without the nested author.
export interface BookRecord {
  id: string;
  isbn: string;
  title: string;
  description: string | null;
  author_id: string;
  url: string | null;
  genre: BookGenre;
  total_copies: number;
  available_copies: number;
  created_at: string;
}

// What GET /book and GET /book/:id return.
export interface Book extends BookRecord {
  author: Author;
}

export interface PostBookDTO {
  isbn: string;
  title: string;
  description?: string;
  author_id: string;
  url?: string;
  genre: BookGenre;
  total_copies: number;
}

export type PatchBookDTO = Partial<PostBookDTO>;

export type BookGenre =
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
