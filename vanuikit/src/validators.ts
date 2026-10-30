/**
 * Validadores de campos — cada uno es una fábrica que retorna un objeto con
 * una sola responsabilidad: devolver un mensaje de error o null si pasa.
 * `data` es el conjunto de valores del formulario (para comparar campos).
 */
import type { State } from "vanjs-core";

export type ValidatorMessage = string | State<string>;

const resolveMsg = (msg: ValidatorMessage): string => {
  return typeof msg === "string" ? msg : msg.val;
};

export interface Validator {
  /** Devuelve mensaje de error, o null si el valor es válido. */
  validate(value: string, data?: Record<string, unknown>): string | null;
}

export const Required = (msg: ValidatorMessage = "Campo requerido"): Validator => ({
  validate: (value) => (value.trim() ? null : resolveMsg(msg)),
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const Email = (msg: ValidatorMessage = "Correo electrónico inválido"): Validator => ({
  validate: (value) => (EMAIL_RE.test(value) ? null : resolveMsg(msg)),
});

export const MinLength = (
  min: number,
  msg: ValidatorMessage = `Mínimo ${min} caracteres`,
): Validator => ({
  validate: (value) => (value.length >= min ? null : resolveMsg(msg)),
});

/** Compara contra otro campo del formulario (p. ej. confirmar contraseña). */
export const Match = (
  otherName: string,
  msg: ValidatorMessage = "No coinciden",
): Validator => ({
  validate: (value, data) => (value === data?.[otherName] ? null : resolveMsg(msg)),
});
