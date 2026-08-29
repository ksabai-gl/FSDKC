import { describe, it, expect, vi, beforeEach } from "vitest";

const getMock = vi.fn();
const postMock = vi.fn();

vi.mock("./client.js", () => ({
  default: {
    get: getMock,
    post: postMock,
  },
}));

import { getCsrfCookie, login, logout, getUser } from "./auth.js";

describe("api/auth", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
  });

  it("getCsrfCookie() requests the sanctum csrf-cookie endpoint via the shared client", async () => {
    getMock.mockResolvedValueOnce({ status: 204 });

    await getCsrfCookie();

    expect(getMock).toHaveBeenCalledWith("/sanctum/csrf-cookie");
  });

  it("login() fetches the CSRF cookie before posting credentials (bug fix: no separate token client)", async () => {
    getMock.mockResolvedValueOnce({ status: 204 });
    postMock.mockResolvedValueOnce({ data: { id: 1 } });

    const credentials = { email: "user@example.com", password: "secret" };
    const result = await login(credentials);

    expect(getMock).toHaveBeenCalledWith("/sanctum/csrf-cookie");
    expect(postMock).toHaveBeenCalledWith("/login", credentials);
    // CSRF cookie must be fetched before the login POST.
    const getOrder = getMock.mock.invocationCallOrder[0];
    const postOrder = postMock.mock.invocationCallOrder[0];
    expect(getOrder).toBeLessThan(postOrder);
    expect(result.data).toEqual({ id: 1 });
  });

  it("logout() posts to /logout via the shared client", async () => {
    postMock.mockResolvedValueOnce({ status: 204 });

    await logout();

    expect(postMock).toHaveBeenCalledWith("/logout");
  });

  it("getUser() gets /api/user via the shared client", async () => {
    getMock.mockResolvedValueOnce({ data: { name: "Jane" } });

    const result = await getUser();

    expect(getMock).toHaveBeenCalledWith("/api/user");
    expect(result.data).toEqual({ name: "Jane" });
  });

  it("edge case: login() rejects/propagates when credentials are missing (no silent Bearer fallback)", async () => {
    getMock.mockResolvedValueOnce({ status: 204 });
    postMock.mockRejectedValueOnce(new Error("422 validation failed"));

    await expect(login(undefined)).rejects.toThrow("422 validation failed");
    expect(postMock).toHaveBeenCalledWith("/login", undefined);
  });
});
