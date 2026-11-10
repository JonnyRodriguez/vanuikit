/**
 * Types shared between controllers, repositories and data.
 *
 * Keeping contracts explicit (interface/type) is a PHP pattern
 * (DTO — Data Transfer Object) that allows controllers to validate
 * and repositories to work with known types instead of `unknown`.
 */

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
