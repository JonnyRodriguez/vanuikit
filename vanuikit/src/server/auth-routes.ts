// vanuikit/src/server/auth-routes.ts
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { createAuthMiddleware } from "./hono.js";
import type { BaseUser, SessionStore } from "./session.js";

export interface CookieConfig {
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Lax" | "Strict" | "None";
}

export interface CreateAuthRoutesOptions<TUser extends BaseUser = BaseUser> {
  sessionStore: SessionStore<TUser>;
  cookieName?: string;
  cookieOptions?: CookieConfig;
  onLogin: (
    credentials: Record<string, any>,
    c: any,
  ) => Promise<TUser | null> | TUser | null;
  onRegister?: (
    data: Record<string, any>,
    c: any,
  ) => Promise<TUser | { error: string; status?: number }> | TUser | { error: string; status?: number };
  onLogout?: (token: string, c: any) => Promise<void> | void;
  serializeUser?: (user: TUser) => any;
}

export function createAuthRoutes<TUser extends BaseUser = BaseUser>(
  options: CreateAuthRoutesOptions<TUser>,
) {
  const router = new Hono();
  const cookieName = options.cookieName ?? "session_token";
  const serialize = options.serializeUser ?? ((user) => user);

  const authMiddleware = createAuthMiddleware({
    sessionStore: options.sessionStore,
    cookieName,
  });

  const setAuthCookie = (c: any, token: string, expiresAt: Date) => {
    setCookie(c, cookieName, token, {
      path: options.cookieOptions?.path ?? "/",
      httpOnly: options.cookieOptions?.httpOnly ?? true,
      secure: options.cookieOptions?.secure ?? (process.env.NODE_ENV === "production"),
      sameSite: options.cookieOptions?.sameSite ?? "Lax",
      expires: expiresAt,
    });
  };

  if (options.onRegister) {
    router.post("/register", async (c) => {
      const body = await c.req.json().catch(() => ({}));
      try {
        const result = await options.onRegister!(body, c);

        if (!result || ("error" in result && typeof result.error === "string")) {
          const err = result as { error: string; status?: number };
          return c.json({ error: err.error }, (err.status as any) ?? 400);
        }

        const user = result as TUser;
        const session = await options.sessionStore.create(user);
        setAuthCookie(c, session.token, session.expiresAt);

        return c.json(
          {
            user: serialize(user),
            token: session.token,
            expiresAt: session.expiresAt.toISOString(),
          },
          201,
        );
      } catch (err: any) {
        return c.json({ error: err?.message || "Error processing registration" }, 400);
      }
    });
  }

  router.post("/login", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    try {
      const user = await options.onLogin(body, c);

      if (!user) {
        return c.json({ error: "Credenciales incorrectas" }, 401);
      }

      const session = await options.sessionStore.create(user);
      setAuthCookie(c, session.token, session.expiresAt);

      return c.json({
        user: serialize(user),
        token: session.token,
        expiresAt: session.expiresAt.toISOString(),
      });
    } catch (err: any) {
      return c.json({ error: err?.message || "Error signing in" }, 500);
    }
  });

  router.get("/me", authMiddleware, (c) => {
    const user = c.get("user" as any);
    return c.json({ user: serialize(user) });
  });

  router.post("/logout", async (c) => {
    const authHeader = c.req.header("Authorization");
    const bearerToken = authHeader?.replace(/^Bearer\s+/i, "").trim();
    const cookieToken = getCookie(c, cookieName);
    const token = bearerToken || cookieToken;

    if (token) {
      await options.sessionStore.delete(token);
      if (options.onLogout) {
        await options.onLogout(token, c);
      }
    }

    deleteCookie(c, cookieName, { path: options.cookieOptions?.path ?? "/" });
    return c.json({ ok: true, message: "Signed out successfully" });
  });

  return router;
}
