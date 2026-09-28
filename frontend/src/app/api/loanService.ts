import { apiFetch, readJson } from "@/lib/client";
import {
  Loan,
  PatchLoanDTO,
  PostLoanDTO,
  ReturnLoanResult,
} from "@/lib/types/loan";

export const fetchMemberLoans = async (
  id: string,
  token: string,
): Promise<Loan[]> => {
  const response = await apiFetch(`/loan/member/${id}`, {}, token);
  return readJson(response, "Failed to fetch member loans.");
};

export const fetchLoans = async (token: string): Promise<Loan[]> => {
  const response = await apiFetch("/loan", {}, token);
  return readJson(response, "Fetching loans failed.");
};

export const fetchLoan = async (id: string, token: string): Promise<Loan> => {
  const response = await apiFetch(`/loan/${id}`, {}, token);
  return readJson(response, "Fetching loan failed.");
};

export const postLoan = async (
  data: PostLoanDTO,
  token: string,
): Promise<Loan> => {
  const response = await apiFetch(
    "/loan",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  );

  return readJson(response, "Failed to check out book.");
};

export const patchLoan = async (
  id: string,
  data: PatchLoanDTO,
  token: string,
): Promise<ReturnLoanResult> => {
  const response = await apiFetch(
    `/loan/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
    token,
  );

  return readJson(response, "Failed to update loan.");
};
