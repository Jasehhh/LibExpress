import { apiFetch } from "@/lib/client";

export const login = async (
  email: string,
  password: string,
): Promise<{ token: string }> => {
  const response = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) throw new Error("Invalid credentials.");
  return response.json();
};

// Once an account exists, only a signed-in user can add another, so pass
// their token. The first account is created without one.
export const register = async (
  email: string,
  password: string,
  token?: string,
): Promise<{ token: string }> => {
  const response = await apiFetch(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    token,
  );

  if (!response.ok) throw new Error("Registration failed.");
  return response.json();
};
