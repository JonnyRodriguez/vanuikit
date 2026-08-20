/**
 * Validadores de campos — cada uno es una fábrica que retorna un objeto con
 * una sola responsabilidad: devolver un mensaje de error o null si pasa.
 * `data` es el conjunto de valores del formulario (para comparar campos).
 */
export interface Validator {
  /** Devuelve mensaje de error, o null si el valor es válido. */
  validate(value: string, data?: Record<string, unknown>): string | null;
}

export const Required = (msg = "Campo requerido"): Validator => ({
  validate: (value) => (value.trim() ? null : msg),
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const Email = (msg = "Correo electrónico inválido"): Validator => ({
  validate: (value) => (EMAIL_RE.test(value) ? null : msg),
});

export const MinLength = (
  min: number,
  msg = `Mínimo ${min} caracteres`,
): Validator => ({
  validate: (value) => (value.length >= min ? null : msg),
});

/** Compara contra otro campo del formulario (p. ej. confirmar contraseña). */
export const Match = (
  otherName: string,
  msg = "No coinciden",
): Validator => ({
  validate: (value, data) => (value === data?.[otherName] ? null : msg),
});
