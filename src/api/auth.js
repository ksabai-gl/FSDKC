import client from "./client";

// Must be called before any Discovery/Connect/Dashboard request.
// For Sanctum SPA (cookie) auth: hit the CSRF cookie endpoint first.
export async function login(email, password) {
  await client.get("/sanctum/csrf-cookie");
  const response = await client.post("/login", { email, password });
  if (response.data && response.data.token) {
    localStorage.setItem("auth_token", response.data.token);
  }
  return response.data;
}

export function logout() {
  localStorage.removeItem("auth_token");
}
