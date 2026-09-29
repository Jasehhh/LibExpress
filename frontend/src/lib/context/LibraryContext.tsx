"use client";

import { createContext, useContext, useReducer } from "react";
import { Author } from "@/lib/types/author";
import { Book, BookRecord } from "@/lib/types/book";
import { Fine } from "@/lib/types/fine";
import { Loan, ReturnLoanResult } from "@/lib/types/loan";
import { Member } from "@/lib/types/member";

interface LibraryState {
  books: Book[];
  authors: Author[];
  members: Member[];
  loans: Loan[];
  fines: Fine[];
  loading: boolean;
  error: string | null;
}

type LibraryAction =
  | { type: "REQUEST_START" }
  | { type: "REQUEST_FAILURE"; payload: string }

  | { type: "BOOKS_LOADED"; payload: Book[] }
  | { type: "BOOK_ADDED"; payload: BookRecord }
  | { type: "BOOK_UPDATED"; payload: BookRecord }
  | { type: "BOOK_DELETED"; payload: string }
  | { type: "AUTHORS_LOADED"; payload: Author[] }
  | { type: "AUTHOR_ADDED"; payload: Author }
  | { type: "AUTHOR_UPDATED"; payload: Author }
  | { type: "AUTHOR_DELETED"; payload: string }

  | { type: "MEMBERS_LOADED"; payload: Member[] }
  | { type: "MEMBER_ADDED"; payload: Member }
  | { type: "MEMBER_UPDATED"; payload: Member }
  | { type: "MEMBER_DELETED"; payload: string }

  | { type: "LOANS_LOADED"; payload: Loan[] }
  | { type: "LOAN_CREATED"; payload: Loan }
  | { type: "LOAN_RETURNED"; payload: ReturnLoanResult }

  | { type: "FINES_LOADED"; payload: Fine[] }
  | { type: "FINE_UPDATED"; payload: Fine };

const initialLibraryState: LibraryState = {
  books: [],
  authors: [],
  members: [],
  loans: [],
  fines: [],
  loading: false,
  error: null,
};

// POST or ih PATCH kag ih return ang book without the nested author, so ih attach it from state.
function withAuthor(record: BookRecord, authors: Author[]): Book {
  const author = authors.find((a) => a.id === record.author_id) ?? {
    id: record.author_id,
    first_name: "",
    last_name: "",
  };
  return { ...record, author };
}

function libraryReducer(
  state: LibraryState,
  action: LibraryAction,
): LibraryState {
  switch (action.type) {
    case "REQUEST_START":
      return { ...state, loading: true, error: null };
    case "REQUEST_FAILURE":
      return { ...state, loading: false, error: action.payload };

    case "BOOKS_LOADED":
      return { ...state, loading: false, books: action.payload };
    case "BOOK_ADDED":
      return {
        ...state,
        loading: false,
        books: [...state.books, withAuthor(action.payload, state.authors)],
      };
    case "BOOK_UPDATED":
      return {
        ...state,
        loading: false,
        books: state.books.map((b) =>
          b.id === action.payload.id
            ? withAuthor(action.payload, state.authors)
            : b,
        ),
      };
    case "BOOK_DELETED":
      return {
        ...state,
        loading: false,
        books: state.books.filter((b) => b.id !== action.payload),
      };

    case "AUTHORS_LOADED":
      return { ...state, loading: false, authors: action.payload };
    case "AUTHOR_ADDED":
      return {
        ...state,
        loading: false,
        authors: [...state.authors, action.payload],
      };
    case "AUTHOR_UPDATED":
      return {
        ...state,
        loading: false,
        authors: state.authors.map((a) =>
          a.id === action.payload.id ? action.payload : a,
        ),
        // keep the nested author on books in sync
        books: state.books.map((b) =>
          b.author_id === action.payload.id
            ? { ...b, author: action.payload }
            : b,
        ),
      };
    case "AUTHOR_DELETED":
      return {
        ...state,
        loading: false,
        authors: state.authors.filter((a) => a.id !== action.payload),
      };


    case "MEMBERS_LOADED":
      return { ...state, loading: false, members: action.payload };
    case "MEMBER_ADDED":
      return {
        ...state,
        loading: false,
        members: [...state.members, action.payload],
      };
    case "MEMBER_UPDATED":
      return {
        ...state,
        loading: false,
        members: state.members.map((m) =>
          m.id === action.payload.id ? action.payload : m,
        ),
      };
    case "MEMBER_DELETED":
      return {
        ...state,
        loading: false,
        members: state.members.filter((m) => m.id !== action.payload),
      };

    case "LOANS_LOADED":
      return { ...state, loading: false, loans: action.payload };
    case "LOAN_CREATED":
      return {
        ...state,
        loading: false,
        loans: [...state.loans, action.payload],
        books: state.books.map((b) =>
          b.id === action.payload.book_id
            ? { ...b, available_copies: b.available_copies - 1 }
            : b,
        ),
      };
    case "LOAN_RETURNED": {
      const { loan, fine } = action.payload;
      return {
        ...state,
        loading: false,
        loans: state.loans.map((l) => (l.id === loan.id ? loan : l)),
        books: state.books.map((b) =>
          b.id === loan.book_id
            ? { ...b, available_copies: b.available_copies + 1 }
            : b,
        ),

        fines: fine ? [...state.fines, fine] : state.fines,
      };
    }

    case "FINES_LOADED":
      return { ...state, loading: false, fines: action.payload };
    case "FINE_UPDATED":
      return {
        ...state,
        loading: false,
        fines: state.fines.map((f) =>
          f.id === action.payload.id ? action.payload : f,
        ),
      };

    default:
      return state;
  }
}

interface LibraryContextValue {
  state: LibraryState;
  dispatch: React.Dispatch<LibraryAction>;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(libraryReducer, initialLibraryState);
  return (
    <LibraryContext.Provider value={{ state, dispatch }}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used inside <LibraryProvider>");
  return ctx;
}