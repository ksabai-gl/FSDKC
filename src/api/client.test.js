import { describe, it, expect, vi, beforeEach } from "vitest";

describe("api/client", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("exports a single Axios instance configured for Sanctum cookie-session auth", async () => {
    const createSpy = vi.fn((config) => ({ __config: config }));
    vi.doMock("axios", () => ({
      default: { create: createSpy },
    }));

    const clientModule = await import("./client.js");
    const client = clientModule.default;

    expect(createSpy).toHaveBeenCalledTimes(1);
    const config = createSpy.mock.calls[0][0];

    expect(config.withCredentials).toBe(true);
    expect(config.withXSRFToken).toBe(true);
    expect(config.headers).toBeDefined();
    expect(config.headers["X-Requested-With"]).toBe("XMLHttpRequest");
    expect(client.__config).toBe(config);
  });

  it("does NOT construct an Authorization header from localStorage (legacy Bearer path removed)", async () => {
    const getItemSpy = vi.fn(() => "some-legacy-token");
    vi.stubGlobal("localStorage", { getItem: getItemSpy, setItem: vi.fn(), removeItem: vi.fn() });

    const createSpy = vi.fn((config) => ({ __config: config }));
    vi.doMock("axios", () => ({
      default: { create: createSpy },
    }));

    await import("./client.js");

    const config = createSpy.mock.calls[0][0];
    expect(config.headers.Authorization).toBeUndefined();
    // The client must not even read the legacy token from localStorage.
    expect(getItemSpy).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("uses baseURL from REACT_APP_API_URL env var", async () => {
    process.env.REACT_APP_API_URL = "https://example.test/api";
    const createSpy = vi.fn((config) => ({ __config: config }));
    vi.doMock("axios", () => ({
      default: { create: createSpy },
    }));

    await import("./client.js");

    const config = createSpy.mock.calls[0][0];
    expect(config.baseURL).toBe("https://example.test/api");
  });
});
