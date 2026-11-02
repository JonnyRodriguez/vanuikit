import { describe, test, expect } from "bun:test";
import { createAuth, requireAuth } from "../src/index.js";

const api = {
  me: async () => ({ user: null }),
  login: async () => ({ user: { id: "1", email: "a@b.com" } }),
  logout: async () => {},
};

const ctx = { to: "/x", params: {}, navigate: () => {} };

describe("createAuth", () => {
  test("boot without session leaves status unauthenticated and user null", async () => {
    const auth = createAuth(api);
    const user = await auth.boot();
    expect(user).toBeNull();
    expect(auth.user.val).toBeNull();
    expect(auth.status.val).toBe("unauthenticated");
    expect(auth.isAuthenticated()).toBe(false);
  });

  test("boot with session leaves status authenticated", async () => {
    const auth = createAuth({ ...api, me: async () => ({ user: { id: "1", email: "a@b.com" } }) });
    const user = await auth.boot();
    expect(user).toEqual({ id: "1", email: "a@b.com" });
    expect(auth.status.val).toBe("authenticated");
    expect(auth.isAuthenticated()).toBe(true);
  });

  test("boot with network error marks unauthenticated", async () => {
    const auth = createAuth({ ...api, me: async () => { throw new Error("offline"); } });
    const user = await auth.boot();
    expect(user).toBeNull();
    expect(auth.status.val).toBe("unauthenticated");
  });

  test("login sets the session and logout clears it", async () => {
    const auth = createAuth(api);
    await auth.login("a@b.com", "x");
    expect(auth.user.val).toEqual({ id: "1", email: "a@b.com" });
    expect(auth.status.val).toBe("authenticated");

    await auth.logout();
    expect(auth.user.val).toBeNull();
    expect(auth.status.val).toBe("unauthenticated");
    expect(auth.isAuthenticated()).toBe(false);
  });

  test("login and register encapsulate token and setSession", async () => {
    localStorage.clear();

    const auth = createAuth({
      ...api,
      login: async () => ({ user: { id: "1", email: "user@test.com" }, token: "jwt_123" }),
      register: async (d) => ({ user: { id: "2", email: d.email as string }, token: "jwt_456" }),
    });

    await auth.login("user@test.com", "pass");
    expect(auth.user.val).toEqual({ id: "1", email: "user@test.com" });
    expect(auth.token.val).toBe("jwt_123");
    expect(auth.getToken()).toBe("jwt_123");
    expect(localStorage.getItem("session_token")).toBe("jwt_123");

    await auth.register({ email: "reg@test.com", password: "pass" });
    expect(auth.user.val?.email).toBe("reg@test.com");
    expect(auth.token.val).toBe("jwt_456");
    expect(localStorage.getItem("session_token")).toBe("jwt_456");

    await auth.logout();
    expect(auth.user.val).toBeNull();
    expect(auth.token.val).toBeNull();
    expect(localStorage.getItem("session_token")).toBeNull();
  });

  test("requireAuth redirects without a session and lets through with one", async () => {
    const auth = createAuth(api);
    const guard = requireAuth(auth, "/login");

    expect(await guard(ctx)).toBe("/login");

    await auth.login("a@b.com", "x");
    expect(await guard(ctx)).toBe(true);
  });

  test("requireAuth waits for boot when the session is idle on direct navigation", async () => {
    const auth = createAuth({ ...api, me: async () => ({ user: { id: "2", email: "direct@access.com" } }) });
    const guard = requireAuth(auth, "/login");

    // Guard runs boot automatically and allows access if there was an active session
    expect(await guard(ctx)).toBe(true);
    expect(auth.user.val).toEqual({ id: "2", email: "direct@access.com" });
  });
});