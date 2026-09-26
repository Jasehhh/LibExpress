export interface Author {
  id: string;
  first_name: string;
  last_name: string;
}

export interface PostAuthorDTO {
  first_name: string;
  last_name: string;
}

export type PatchAuthorDTO = Partial<PostAuthorDTO>;
