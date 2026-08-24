// server/routes/api/auth.route.ts
/**
 * Auth Route — Capa HTTP para autenticación y registro.
 * Maneja solicitudes HTTP y delega la lógica a server/actions/auth.action.ts.
 *
 * Endpoints:
 *   POST /api/auth/login     -> iniciar sesión
 *   POST /api/auth/register  -> crear cuenta
 */
import { Hono } from "hono";
import {
  loginSchema,
  registerSchema,
  loginAction,
  registerAction,
} from "../../actions/auth.action.js";

const authRoute = new Hono();

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
  if (!result.success) {
    return c.json({ error: result.error }, result.status as any);
  }

  return c.json({ status: "ok", data: result.data });
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
  if (!result.success) {
    return c.json({ error: result.error }, result.status as any);
  }

  return c.json({ status: "ok", data: result.data });
});

export default authRoute;
