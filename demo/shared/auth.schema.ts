// demo/shared/auth.schema.ts
/**
 * Shared Zod schemas and authentication types (Frontend & Backend).
 */
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  confirm: z.string().min(1, "Confirm the password"),
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
