// server/actions/auth.action.ts
/**
 * Auth Actions — Lógica pura de autenticación y registro.
 * Desacoplada de la capa de transporte HTTP.
 */
import { z } from "zod";
import { UserRepository, FAIL_EMAIL } from "../repositories/user.repository.js";

// --- Schemas Zod ---

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

export interface ActionResult<T = unknown> {
  success: boolean;
  status: number;
  data?: T;
  error?: string;
  details?: unknown;
}

// --- Funciones de acción (actions) ---

/**
 * Autentica las credenciales de un usuario.
 */
export async function loginAction(input: LoginInput): Promise<ActionResult> {
  const { email, password } = input;

  // Reproducción del caso de prueba mock: fail@example.com siempre falla
  if (email === FAIL_EMAIL) {
    return {
      success: false,
      status: 401,
      error: "Credenciales inválidas para ese correo",
    };
  }

  const user = UserRepository.findForAuth(email);
  if (!user || user.password !== password) {
    return {
      success: false,
      status: 401,
      error: "Credenciales inválidas",
    };
  }

  return {
    success: true,
    status: 200,
    data: { user: { id: user.id, name: user.name, email: user.email } },
  };
}

/**
 * Registra un nuevo usuario en el sistema.
 */
export async function registerAction(input: RegisterInput): Promise<ActionResult> {
  const { name, email, password, confirm } = input;

  if (email === FAIL_EMAIL || UserRepository.findByEmail(email)) {
    return {
      success: false,
      status: 409,
      error: "Ya existe una cuenta con ese correo",
    };
  }

  if (password !== confirm) {
    return {
      success: false,
      status: 400,
      error: "Las contraseñas no coinciden",
    };
  }

  const newUser = UserRepository.create({ name, email, password, confirm });

  return {
    success: true,
    status: 200,
    data: { user: { id: newUser.id, name: newUser.name, email: newUser.email } },
  };
}
