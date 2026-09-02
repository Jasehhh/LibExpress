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

export interface PostBookDTO {
  isbn: string;
  title: string;
  author: string;
  file_id: string;
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
