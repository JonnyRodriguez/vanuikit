// server/routes/api/payment.route.ts
/**
 * Payment Route — Capa HTTP para pasarelas y recargas.
 * Protegida con requireAuth() para asegurar que solo usuarios con sesión activa
 * puedan consultar pasarelas o procesar pagos.
 *
 * Endpoints protegidos:
 *   GET  /api/payment/gateways  -> lista de pasarelas
 *   GET  /api/payment/params    -> parámetros de recarga
 *   POST /api/payment/recharge  -> procesar recarga
 */
import { Hono } from "hono";
import {
  rechargeSchema,
  getGatewaysAction,
  getParamsAction,
  processRechargeAction,
} from "../../actions/payment.action.js";
import {
  requireAuth,
  type AuthVariables,
} from "../../middlewares/auth.middleware.js";

const paymentRoute = new Hono<{ Variables: AuthVariables }>();

// Aplicar middleware de autenticación a todos los endpoints de pago
paymentRoute.use("*", requireAuth());

/**
 * GET /api/payment/gateways
 */
paymentRoute.get("/gateways", async (c) => {
  const gateways = await getGatewaysAction();
  return c.json({ status: "ok", data: gateways });
});

/**
 * GET /api/payment/params
 */
paymentRoute.get("/params", async (c) => {
  const params = await getParamsAction();
  return c.json({ status: "ok", data: params });
});

/**
 * POST /api/payment/recharge
 */
paymentRoute.post("/recharge", async (c) => {
  const body = await c.req.json().catch(() => ({}));

  const parsed = rechargeSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      400,
    );
  }

  const result = await processRechargeAction(parsed.data);
  if (!result.success) {
    return c.json({ error: result.error }, result.status as any);
  }

  return c.json({ status: "ok", data: result.data });
});

export default paymentRoute;
