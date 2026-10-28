/**
 * Guard canónica del paquete para datos JSON sin validar (límite de red).
 * Único lugar donde se define; los demás módulos la importan.
 */

export interface JsonObject {
  [key: string]: unknown;
}

export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
