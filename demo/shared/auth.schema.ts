// demo/shared/auth.schema.ts
/**
 * Esquemas Zod y tipos compartidos de autenticación (Frontend & Backend).
 */
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
  confirm: z.string().min(1, "Confirma la contraseña"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export interface AuthUser {
  id: string | number;
  name: string;
  email: string;
  [key: string]: unknown;
}

export interface AuthResponse {
  user: AuthUser;
  token?: string;
}
