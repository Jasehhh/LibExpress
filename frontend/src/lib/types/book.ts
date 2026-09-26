import { Author } from "./author";

export interface Book {
  id: number;
  isbn: string;
  title: string;
  description: string | null;
  author_id: string;
  author: Author;
  url: string | null;
  genre: BookGenre;
  total_copies: number;
  available_copies: number;
  created_at: Date;
}

export interface PostBookDTO {
  isbn: string;
  title: string;
  description?: string;
  author_id: string;
  url: string;
  genre: string;
  total_copies: number;
}

export type PatchBookDTO = Partial<PostBookDTO>;

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
