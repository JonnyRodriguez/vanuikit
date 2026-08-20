/**
 * Tipos compartidos entre controladores, repositorios y datos.
 *
 * Mantener los contratos explícitos (interface/type) es un patrón PHP
 * (DTO — Data Transfer Object) que permite a los controladores validar
 * y a los repositorios trabajar con tipos conocidos en lugar de `unknown`.
 */

/** Una ***REMOVED*** de transaction. */
export interface ***REMOVED*** {
  id: string;
  name: string;
  img: string;
  currency?: string;
  /** Si existe, al seleccionarla el frontend redirige a esta URL (transaction externo). */
  url?: string;
}

/** Parámetros de ***REMOVED*** enviados al frontend para el formulario. */
export interface ***REMOVED***Params {
  id: number;
  tipo: string;
  monto_min_***REMOVED***: string;
  monto_max_***REMOVED***: string;
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
