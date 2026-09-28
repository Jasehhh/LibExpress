import { apiFetch, readJson } from "@/lib/client";
import { Member, PatchMemberDTO, PostMemberDTO } from "@/lib/types/member";

export const fetchMembers = async (token: string): Promise<Member[]> => {
  const response = await apiFetch("/member", {}, token);
  return readJson(response, "Failed to fetch members.");
};

export const fetchMember = async (
  id: string,
  token: string,
): Promise<Member> => {
  const response = await apiFetch(`/member/${id}`, {}, token);
  return readJson(response, "Failed to fetch member.");
};

export const postMember = async (
  data: PostMemberDTO,
  token: string,
): Promise<Member> => {
  const response = await apiFetch(
    "/member",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  );

  return readJson(response, "Failed to create a member.");
};

export const patchMember = async (
  id: string,
  data: PatchMemberDTO,
  token: string,
): Promise<Member> => {
  const response = await apiFetch(
    `/member/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
    token,
  );

  return readJson(response, "Failed to update member.");
};

export const deleteMember = async (
  id: string,
  token: string,
): Promise<Member> => {
  const response = await apiFetch(`/member/${id}`, { method: "DELETE" }, token);
  return readJson(response, "Failed to delete member.");
};
