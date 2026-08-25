// demo/shared/payment.schema.ts
/**
 * Esquemas Zod y tipos compartidos de pagos y pasarelas (Frontend & Backend).
 */
import { z } from "zod";

export interface Gateway {
  id: string;
  name: string;
  category: "crypto" | "fiat" | "bank" | "wallet";
  symbol: string;
  color: string;
  currency: string;
  img: string;
}

export interface RechargeParams {
  monto_min_recarga: string;
  monto_max_recarga: string;
  tipo: string;
}

export const rechargeSchema = z.object({
  amount: z.string().min(1, "El monto es requerido"),
  gateway: z.record(z.string(), z.unknown()),
});

export type RechargeInput = z.infer<typeof rechargeSchema>;

export interface RechargeResponse {
  url: string;
}
