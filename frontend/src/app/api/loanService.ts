import { apiFetch } from "@/lib/client";
import { Loan, PatchLoanDTO, PostLoanDTO } from "@/lib/types/loan";

export const fetchMemberLoans = async (
  id: string,
  token: string,
): Promise<Loan[]> => {
  const response = await apiFetch(`/loan/member/${id}`, {}, token);
  if (!response.ok) throw new Error("Failed to fetch member loans.");
  return response.json();
};

export const fetchLoans = async (token: string): Promise<Loan[]> => {
  const response = await apiFetch("/loan", {}, token);
  if (!response.ok) throw new Error("Fetching loans failed.");
  return response.json();
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

  if (!response.ok) throw new Error("Invalid credentials.");
  return response.json();
};

export const patchLoan = async (
  id: string,
  data: PatchLoanDTO,
  token: string,
): Promise<Loan> => {
  const response = await apiFetch(
    `/loan/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
    token,
  );

  if (!response.ok) throw new Error("Failed to update loan.");
  return response.json();
};
