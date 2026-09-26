import { apiFetch } from "@/lib/client";
import { ActivityPage, ActivityQuery } from "@/lib/types/activity";

export const fetchActivity = async (
  query: ActivityQuery,
  token: string,
): Promise<ActivityPage> => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }

  const response = await apiFetch(`/activity?${params}`, {}, token);
  if (!response.ok) throw new Error("Failed to fetch activity log.");
  return response.json();
};
