// server/controllers/payment.controller.ts
/**
 * PaymentController — equivalente a payment.controller.php en CakePHP.
 *
 * Patrón identico a store/api/src/controllers/auth.controller.ts: acciones
 * inline en un router Hono, validación con Zod y acceso a datos vía un
 * repository (objeto const, sin clases ni servicios). Toda la lógica de
 * negocio (validación del monto, generación de la URL) vive aquí, en el
 * controlador, igual que en store.
 *
 * El apiRouter.ts monta este router en /api/payment, por lo que las rutas
 * aqui definidas se resuelven como:
 *
 *   GET  /api/payment/gateways  -> lista de pasarelas
 *   GET  /api/payment/params    -> parametros de recarga
 *   POST /api/payment/recharge  -> generar recarga (endpoint original: /payment/zpay_recargar)
 */
import { Hono } from "hono";
import { z } from "zod";
import { PaymentRepository } from "../repositories/payment.repository.js";

const payment = new Hono();

// --- Schema Zod para la recarga ---
const rechargeSchema = z.object({
  amount: z.string().min(1, "El monto es requerido"),
  gateway: z.record(z.string(), z.unknown()),
});

// --- Acciones (actions) ---

/**
 * gateways — GET /api/payment/gateways
 *
 *  200  { status: "ok", data: [...] }
 */
payment.get("/gateways", (c) => {
  return c.json({ status: "ok", data: PaymentRepository.getGateways() });
});

/**
 * params — GET /api/payment/params
 *
 *  200  { status: "ok", data: {...} }
 */
payment.get("/params", (c) => {
  return c.json({ status: "ok", data: PaymentRepository.getParams() });
});

/**
 * recharge — POST /api/payment/recharge
 *
 * Recibe { amount, gateway, ... } del formulario de recarga. Valida el
 * monto contra los límites configurados y devuelve una URL mock con el
 * mismo formato que el backend original.
 *
 *  200  { status: "ok", data: { url: "https://..." } }
 *  400  { error: "Datos invalidos" } | { error: "..." }
 */
payment.post("/recharge", async (c) => {
  const body = await c.req.json();

  const parsed = rechargeSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Datos invalidos", details: parsed.error.flatten() },
      400,
    );
  }

  const params = PaymentRepository.getParams();
  const amount = parseFloat(parsed.data.amount);
  const min = parseFloat(params.monto_min_recarga);
  const max = parseFloat(params.monto_max_recarga);

  // Validación del monto (el frontend también la hace, pero el backend
  // NUNCA confía en la validación del cliente).
  if (Number.isNaN(amount)) {
    return c.json({ error: "Ingresa un monto válido" }, 400);
  }
  if (amount < min) {
    return c.json(
      { error: `El monto debe ser superior a ${min} ${params.tipo}` },
      400,
    );
  }
  if (amount > max) {
    return c.json(
      { error: `El monto debe ser inferior a ${max} ${params.tipo}` },
      400,
    );
  }

  // Simular latencia del backend real (como el mock original: 800ms).
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Generar una URL de recarga mock con el mismo formato que el original.
  const rechargeId = Math.floor(Math.random() * 100000);
  return c.json({
    status: "ok",
    data: { url: `https://plataforma.example/payments/recarga-${rechargeId}` },
  });
});

export default payment;