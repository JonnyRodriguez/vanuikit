/**
 * PaymentRepository — acceso a datos de pagos/recargas (mock en memoria).
 *
 * Patrón store (store/api/src/repositories/*.repository.ts): objeto const
 * con métodos, NO una clase. El controller llama directo sin `new`.
 *
 * Las pasarelas y parámetros viven en ../data (el "seeder"); aquí solo
 * se exponen lecturas tipadas. La lógica de negocio (validación de montos,
 * generación de URL) está en el controller, igual que en store.
 */
import { gateways, rechargeParams } from "../data/index.js";
import type { Gateway, RechargeParams } from "../types.js";

export const PaymentRepository = {
  /** Lista de pasarelas disponibles (para el selector del frontend). */
  getGateways(): Gateway[] {
    return gateways;
  },

  /** Parámetros de recarga (límites, moneda, center_id). */
  getParams(): RechargeParams {
    return rechargeParams;
  },
};