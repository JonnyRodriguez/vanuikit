import { describe, test, expect } from "bun:test";
import { createAuth, requireAuth } from "../src/index.js";

const api = {
  me: async () => ({ user: null }),
  login: async () => ({ user: { id: "1", email: "a@b.com" } }),
  logout: async () => {},
};

const ctx = { to: "/x", params: {}, navigate: () => {} };

describe("createAuth", () => {
  test("boot sin sesión deja status unauthenticated y usuario null", async () => {
    const auth = createAuth(api);
    const user = await auth.boot();
    expect(user).toBeNull();
    expect(auth.user.val).toBeNull();
    expect(auth.status.val).toBe("unauthenticated");
    expect(auth.isAuthenticated()).toBe(false);
  });

  test("boot con sesión deja status authenticated", async () => {
    const auth = createAuth({ ...api, me: async () => ({ user: { id: "1", email: "a@b.com" } }) });
    const user = await auth.boot();
    expect(user).toEqual({ id: "1", email: "a@b.com" });
    expect(auth.status.val).toBe("authenticated");
    expect(auth.isAuthenticated()).toBe(true);
  });

  test("boot con error de red marca unauthenticated", async () => {
    const auth = createAuth({ ...api, me: async () => { throw new Error("offline"); } });
    const user = await auth.boot();
    expect(user).toBeNull();
    expect(auth.status.val).toBe("unauthenticated");
  });

  test("login establece la sesión y logout la limpia", async () => {
    const auth = createAuth(api);
    await auth.login("a@b.com", "x");
    expect(auth.user.val).toEqual({ id: "1", email: "a@b.com" });
    expect(auth.status.val).toBe("authenticated");

    await auth.logout();
    expect(auth.user.val).toBeNull();
    expect(auth.status.val).toBe("unauthenticated");
    expect(auth.isAuthenticated()).toBe(false);
  });

  test("requireAuth redirige si no hay sesión y deja pasar si la hay", async () => {
    const auth = createAuth(api);
    const guard = requireAuth(auth, "/login");

    expect(await guard(ctx)).toBe("/login");

    await auth.login("a@b.com", "x");
    expect(await guard(ctx)).toBe(true);
  });

  test("requireAuth espera a boot si la sesión está idle en navegación directa", async () => {
    const auth = createAuth({ ...api, me: async () => ({ user: { id: "2", email: "direct@access.com" } }) });
    const guard = requireAuth(auth, "/login");

    // Guard ejecuta boot automáticamente y permite el acceso si había sesión activa
    expect(await guard(ctx)).toBe(true);
    expect(auth.user.val).toEqual({ id: "2", email: "direct@access.com" });
  });
});