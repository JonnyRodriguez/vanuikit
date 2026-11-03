// server/routes/api/auth.route.ts
/**
 * Auth Route — HTTP layer for authentication, registration and session control.
 *
 * Endpoints:
 *   POST /api/auth/login     -> Log in (creates a session and cookie)
 *   POST /api/auth/register  -> Create account (creates a session and cookie)
 *   GET  /api/auth/me        -> Gets the current authenticated user
 *   POST /api/auth/logout    -> Log out (invalidates session and cookie)
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

  // Create a session on the server and set a secure HTTP-Only cookie
  const session = SessionRepository.create(result.data.user);
  setCookie(c, SESSION_COOKIE_NAME, session.token, {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    maxAge: 24 * 60 * 60, // 24 hours
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

  // Automatically create a session for the newly registered user
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
 * Protected endpoint to query the current authentication state.
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
 * Destroys the session on the server and deletes the cookie on the client.
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

// Deny-by-default: this file is declared PUBLIC (login/register cannot
// ask for a session). Fine-grained refinement stays alive inside: /me uses requireAuth().
export const meta = { public: true };
