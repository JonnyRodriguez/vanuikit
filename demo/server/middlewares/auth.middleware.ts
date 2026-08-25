// demo/server/middlewares/auth.middleware.ts
/**
 * Auth Middleware — Protección de rutas mediante verificación de sesiones.
 *
 * Lee la sesión desde:
 *  1. Header `Authorization: Bearer <token>`
 *  2. Cookie `session_token`
 */
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { SessionRepository, type Session } from "../repositories/session.repository.js";

export const SESSION_COOKIE_NAME = "session_token";

export interface AuthVariables {
  user: Session["user"];
  session: Session;
}

export interface RequireAuthOptions {
  redirectTo?: string;
  jsonOnly?: boolean;
}

/**
 * Middleware para proteger endpoints de la API.
 */
export const requireAuth = (options: RequireAuthOptions = {}) => {
  return createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    // 1. Extraer token de Authorization header o cookies
    const authHeader = c.req.header("Authorization");
    let bearerToken: string | null = null;
    if (authHeader) {
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      if (match) {
        bearerToken = match[1].trim();
      }
    }

    const cookieToken = getCookie(c, SESSION_COOKIE_NAME);
    const token = bearerToken || cookieToken;

    // 2. Validar sesión existente y activa
    const session = token ? SessionRepository.get(token) : null;

    if (!session) {
      return c.json(
        {
          error: "No autorizado. Inicia sesión para acceder a este recurso.",
          code: "UNAUTHORIZED",
        },
        401,
      );
    }

    // 3. Adjuntar datos al contexto para controladores posteriores
    c.set("user", session.user);
    c.set("session", session);

    await next();
  });
};

/**
 * Helper para verificar si una petición tiene sesión válida (sin bloquear).
 */
export function getSessionFromContext(c: any): Session | null {
  const authHeader = c.req.header("Authorization");
  const bearerToken = authHeader?.replace(/^Bearer\s+/i, "").trim();
  const token = bearerToken || getCookie(c, SESSION_COOKIE_NAME);
  return token ? SessionRepository.get(token) : null;
}
