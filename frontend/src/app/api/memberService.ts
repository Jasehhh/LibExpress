import { apiFetch } from "@/lib/client";
import { Member, PatchMemberDTO, PostMemberDTO } from "@/lib/types/member";

export const fetchMembers = async (token: string): Promise<Member[]> => {
  const response = await apiFetch("/member", {}, token);
  if (!response.ok) throw new Error("Failed to fetch members.");
  return response.json();
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

  if (!response.ok) throw new Error("Failed to create a member.");
  return response.json();
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

  if (!response.ok) throw new Error("Failed to update member.");
  return response.json();
};

export const deleteMember = async (
  id: string,
  token: string,
): Promise<Member> => {
  const response = await apiFetch(`/member/${id}`, { method: "DELETE" }, token);
  if (!response.ok) throw new Error("Failed to delete member.");
  return response.json();
};
