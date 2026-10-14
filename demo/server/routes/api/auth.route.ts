// server/routes/api/auth.route.ts
/**
 * Auth Route — Capa HTTP para autenticación, registro y control de sesión.
 *
 * Endpoints:
 *   POST /api/auth/login     -> Iniciar sesión (crea sesión y cookie)
 *   POST /api/auth/register  -> Crear cuenta (crea sesión y cookie)
 *   GET  /api/auth/me        -> Obtiene el usuario autenticado actual
 *   POST /api/auth/logout    -> Cierra sesión (invalida sesión y cookie)
 */
import { Hono } from "hono";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import {
  loginSchema,
  registerSchema,
  loginAction,
  registerAction,
} from "../../actions/auth.action.js";
import { SessionRepository } from "../../repositories/session.repository.js";
import {
  requireAuth,
  SESSION_COOKIE_NAME,
  type AuthVariables,
} from "../../middlewares/auth.middleware.js";

const authRoute = new Hono<{ Variables: AuthVariables }>();

/**
 * POST /api/auth/login
 */
authRoute.post("/login", async (c) => {
  const body = await c.req.json().catch(() => ({}));

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      400,
    );
  }

  const result = await loginAction(parsed.data);
  if (!result.success || !result.data) {
    return c.json({ error: result.error }, (result.status || 401) as any);
  }

  // Crear sesión en el servidor y configurar cookie HTTP-Only segura
  const session = SessionRepository.create(result.data.user);
  setCookie(c, SESSION_COOKIE_NAME, session.token, {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    maxAge: 24 * 60 * 60, // 24 horas
  });

  return c.json({
    status: "ok",
    data: {
      user: result.data.user,
      token: session.token,
    },
  });
});

/**
 * POST /api/auth/register
 */
authRoute.post("/register", async (c) => {
  const body = await c.req.json().catch(() => ({}));

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      400,
    );
  }

  const result = await registerAction(parsed.data);
  if (!result.success || !result.data) {
    return c.json({ error: result.error }, (result.status || 400) as any);
  }

  // Crear sesión automáticamente para el nuevo usuario registrado
  const session = SessionRepository.create(result.data.user);
  setCookie(c, SESSION_COOKIE_NAME, session.token, {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    maxAge: 24 * 60 * 60,
  });

  return c.json({
    status: "ok",
    data: {
      user: result.data.user,
      token: session.token,
    },
  });
});

/**
 * GET /api/auth/me
 * Endpoint protegido para consultar el estado actual de autenticación.
 */
authRoute.get("/me", requireAuth(), (c) => {
  const user = c.get("user");
  const session = c.get("session");
  return c.json({
    status: "ok",
    data: {
      user,
      expiresAt: session?.expiresAt,
    },
  });
});

/**
 * POST /api/auth/logout
 * Destruye la sesión en servidor y borra la cookie en el cliente.
 */
authRoute.post("/logout", (c) => {
  const token = getCookie(c, SESSION_COOKIE_NAME);
  if (token) {
    SessionRepository.delete(token);
  }

  deleteCookie(c, SESSION_COOKIE_NAME, {
    path: "/",
  });

  return c.json({
    status: "ok",
    message: "Sesión cerrada correctamente",
  });
});

export default authRoute;

// Deny-by-default: este archivo se declara PÚBLICO (login/register no pueden
// pedir sesión). El refinamiento fino sigue vivo dentro: /me usa requireAuth().
export const meta = { public: true };
