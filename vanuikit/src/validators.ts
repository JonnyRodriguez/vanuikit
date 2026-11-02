/**
 * Field validators — each one is a factory returning an object with a single
 * responsibility: return an error message or null if it passes.
 * `data` is the set of form values (for comparing fields).
 */
import type { State } from "vanjs-core";

export type ValidatorMessage = string | State<string>;

const resolveMsg = (msg: ValidatorMessage): string => {
  return typeof msg === "string" ? msg : msg.val;
};

export interface Validator {
  /** Returns an error message, or null if the value is valid. */
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

/** Compares against another form field (e.g. password confirmation). */
export const Match = (
  otherName: string,
  msg: ValidatorMessage = "No coinciden",
): Validator => ({
  validate: (value, data) => (value === data?.[otherName] ? null : resolveMsg(msg)),
});
