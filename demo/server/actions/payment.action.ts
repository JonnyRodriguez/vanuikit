// server/actions/payment.action.ts
/**
 * Payment Actions — Lógica pura de pasarelas y procesamiento de recargas.
 * Desacoplada de la capa de transporte HTTP.
 */
import { z } from "zod";
import { PaymentRepository } from "../repositories/payment.repository.js";

// --- Schemas Zod ---

export const rechargeSchema = z.object({
  amount: z.string().min(1, "El monto es requerido"),
  gateway: z.record(z.string(), z.unknown()),
});

export type RechargeInput = z.infer<typeof rechargeSchema>;

export interface ActionResult<T = unknown> {
  success: boolean;
  status: number;
  data?: T;
  error?: string;
  details?: unknown;
}

// --- Funciones de acción (actions) ---

/**
 * Obtiene la lista de pasarelas de pago disponibles.
 */
export async function getGatewaysAction() {
  return PaymentRepository.getGateways();
}

/**
 * Obtiene los parámetros y límites de configuración de recargas.
 */
export async function getParamsAction() {
  return PaymentRepository.getParams();
}

/**
 * Procesa la solicitud de recarga y genera la URL / referencia de pago.
 */
export async function processRechargeAction(input: RechargeInput): Promise<ActionResult<{ url: string }>> {
  const params = PaymentRepository.getParams();
  const amount = parseFloat(input.amount);
  const min = parseFloat(params.monto_min_recarga);
  const max = parseFloat(params.monto_max_recarga);

  if (Number.isNaN(amount)) {
    return {
      success: false,
      status: 400,
      error: "Ingresa un monto válido",
    };
  }

  if (amount < min) {
    return {
      success: false,
      status: 400,
      error: `El monto debe ser superior a ${min} ${params.tipo}`,
    };
  }

  if (amount > max) {
    return {
      success: false,
      status: 400,
      error: `El monto debe ser inferior a ${max} ${params.tipo}`,
    };
  }

  // Simulación de latencia con pasarela real (800ms)
  await new Promise((resolve) => setTimeout(resolve, 800));

  const rechargeId = Math.floor(Math.random() * 100000);
  return {
    success: true,
    status: 200,
    data: {
      url: `https://plataforma.example/payments/recarga-${rechargeId}`,
    },
  };
}
