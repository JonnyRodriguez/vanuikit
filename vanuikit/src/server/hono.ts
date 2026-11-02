// vanuikit/src/server/hono.ts
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import type { BaseUser, Session, SessionStore } from "./session.js";

export interface HonoAuthVariables<TUser extends BaseUser = BaseUser> {
  user: TUser;
  session: Session<TUser>;
}

export interface AuthMiddlewareOptions<TUser extends BaseUser = BaseUser> {
  sessionStore: SessionStore<TUser>;
  cookieName?: string;
  unauthorizedMessage?: string;
}

export function createAuthMiddleware<TUser extends BaseUser = BaseUser>(
  options: AuthMiddlewareOptions<TUser>,
) {
  const cookieName = options.cookieName ?? "session_token";
  const unauthorizedMessage =
    options.unauthorizedMessage ?? "Unauthorized. Sign in to access this resource.";

  return createMiddleware<{ Variables: HonoAuthVariables<TUser> }>(async (c, next) => {
    const authHeader = c.req.header("Authorization");
    let bearerToken: string | null = null;
    if (authHeader) {
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      if (match) {
        bearerToken = match[1].trim();
      }
    }

    const cookieToken = getCookie(c, cookieName);
    const token = bearerToken || cookieToken;
    const session = token ? await Promise.resolve(options.sessionStore.get(token)) : null;

    if (!session) {
      return c.json(
        {
          error: unauthorizedMessage,
          code: "UNAUTHORIZED",
        },
        401,
      );
    }

    c.set("user", session.user);
    c.set("session", session);

    await next();
  });
}

export async function getSessionFromHonoContext<TUser extends BaseUser = BaseUser>(
  c: any,
  sessionStore: SessionStore<TUser>,
  cookieName: string = "session_token",
): Promise<Session<TUser> | null> {
  const authHeader = c.req.header("Authorization");
  const bearerToken = authHeader?.replace(/^Bearer\s+/i, "").trim();
  const token = bearerToken || getCookie(c, cookieName);
  return token ? await Promise.resolve(sessionStore.get(token)) : null;
}
