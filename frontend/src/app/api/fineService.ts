import { apiFetch, readJson } from "@/lib/client";
import { Fine, PatchFineDTO } from "@/lib/types/fine";

export const fetchMemberFines = async (
  id: string,
  token: string,
): Promise<Fine[]> => {
  const response = await apiFetch(`/fine/member/${id}`, {}, token);
  return readJson(response, "Failed to fetch member fines.");
};

export const fetchFines = async (token: string): Promise<Fine[]> => {
  const response = await apiFetch("/fine", {}, token);
  return readJson(response, "Failed to fetch fines.");
};

export const fetchFine = async (id: string, token: string): Promise<Fine> => {
  const response = await apiFetch(`/fine/${id}`, {}, token);
  return readJson(response, "Failed to fetch fine.");
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

  return readJson(response, "Failed to update fine.");
};
