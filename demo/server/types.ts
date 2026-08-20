/**
 * Tipos compartidos entre controladores, repositorios y datos.
 *
 * Mantener los contratos explícitos (interface/type) es un patrón PHP
 * (DTO — Data Transfer Object) que permite a los controladores validar
 * y a los repositorios trabajar con tipos conocidos en lugar de `unknown`.
 */

/** Una pasarela de pago. */
export interface Gateway {
  id: string;
  name: string;
  img: string;
  currency?: string;
  /** Si existe, al seleccionarla el frontend redirige a esta URL (pago externo). */
  url?: string;
}

/** Parámetros de recarga enviados al frontend para el formulario. */
export interface RechargeParams {
  id: number;
  tipo: string;
  monto_min_recarga: string;
  monto_max_recarga: string;
  [key: string]: unknown;
}

/** Usuario (sin password). */
export interface User {
  id: number;
  name: string;
  email: string;
}

/** Datos de registro. */
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirm: string;
}
