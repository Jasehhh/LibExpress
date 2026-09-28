import { apiFetch, readJson } from "@/lib/client";

export const login = async (
  email: string,
  password: string,
): Promise<{ token: string }> => {
  const response = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  return readJson(response, "Invalid credentials.");
};

export const register = async (
  email: string,
  password: string,
): Promise<{ token: string }> => {
  const response = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  return readJson(response, "Registration failed.");
};
