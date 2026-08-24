// server/routes/api/payment.route.ts
/**
 * Payment Route — Capa HTTP para pasarelas y recargas.
 * Delega la lógica de negocio a server/actions/payment.action.ts.
 *
 * Endpoints:
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

const paymentRoute = new Hono();

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
