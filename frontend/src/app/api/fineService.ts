import { apiFetch } from "@/lib/client";
import { Fine, PatchFineDTO } from "@/lib/types/fine";

export const fetchMemberFine = async (
  id: string,
  token: string,
): Promise<Fine> => {
  const response = await apiFetch(`/fine/member/${id}`, {}, token);
  if (!response.ok) throw new Error("Failed to fetch member fines.");
  return response.json();
};

export const fetchFines = async (token: string): Promise<Fine[]> => {
  const response = await apiFetch("/fine", {}, token);
  if (!response.ok) throw new Error("Failed to fetch fines.");
  return response.json();
};

export const patchFine = async (
  id: string,
  data: PatchFineDTO,
  token: string,
): Promise<Fine> => {
  const response = await apiFetch(
    `/fine/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
    token,
  );

  if (!response.ok) throw new Error("Failed to update fine.");
  return response.json();
};
