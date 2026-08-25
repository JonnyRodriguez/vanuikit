// demo/server/middlewares/auth.middleware.ts
import {
  createAuthMiddleware,
  getSessionFromHonoContext,
  type HonoAuthVariables,
} from "../../../vanui/src/server/index.js";
import { SessionRepository } from "../repositories/session.repository.js";
import type { AuthUser } from "../../shared/auth.schema.js";

export type AuthVariables = HonoAuthVariables<AuthUser>;

export const SESSION_COOKIE_NAME = "session_token";

export const requireAuth = (options?: { unauthorizedMessage?: string }) => {
  return createAuthMiddleware<AuthUser>({
    sessionStore: SessionRepository,
    cookieName: SESSION_COOKIE_NAME,
    unauthorizedMessage: options?.unauthorizedMessage,
  });
};

export async function getSessionFromContext(c: any) {
  return await getSessionFromHonoContext<AuthUser>(c, SessionRepository, SESSION_COOKIE_NAME);
}
