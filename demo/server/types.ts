/**
 * Types shared between controllers, repositories and data.
 *
 * Keeping contracts explicit (interface/type) is a PHP pattern
 * (DTO — Data Transfer Object) that allows controllers to validate
 * and repositories to work with known types instead of `unknown`.
 */

/** A ***REMOVED*** ***REMOVED***. */
export interface ***REMOVED*** {
  id: string;
  name: string;
  img: string;
  currency?: string;
  /** If present, when selected the frontend redirects to this URL (external ***REMOVED***). */
  url?: string;
}

/** ***REMOVED*** parameters sent to the frontend for the form. */
export interface ***REMOVED***Params {
  id: number;
  tipo: string;
  monto_min_***REMOVED***: string;
  monto_max_***REMOVED***: string;
  [key: string]: unknown;
}

/** User (without password). */
export interface User {
  id: number;
  name: string;
  email: string;
}

/** Registration data. */
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirm: string;
}
