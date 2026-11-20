// server/actions/auth.action.ts
/**
 * Auth Actions — Pure authentication and registration logic.
 * Consumes shared schemas from demo/shared/auth.schema.ts.
 */
import { UserRepository, FAIL_EMAIL } from "../repositories/user.repository.js";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
  type AuthResponse,
} from "../../shared/auth.schema.js";

export { loginSchema, registerSchema };
export type { LoginInput, RegisterInput };

export interface ActionResult<T = unknown> {
  success: boolean;
  status: number;
  data?: T;
  error?: string;
  details?: unknown;
}

/**
 * Authenticates a user's credentials.
 */
export async function loginAction(input: LoginInput): Promise<ActionResult<AuthResponse>> {
  const { email, password } = input;

  if (email === FAIL_EMAIL) {
    return {
      success: false,
      status: 401,
      error: "Invalid credentials for that email",
    };
  }

  const user = UserRepository.findForAuth(email);
  if (!user || user.password !== password) {
    return {
      success: false,
      status: 401,
      error: "Invalid credentials",
    };
  }

  return {
    success: true,
    status: 200,
    data: { user: { id: user.id, name: user.name, email: user.email } },
  };
}

/**
 * Registers a new user in the system.
 */
export async function registerAction(input: RegisterInput): Promise<ActionResult<AuthResponse>> {
  const { name, email, password, confirm } = input;

  if (email === FAIL_EMAIL || UserRepository.findByEmail(email)) {
    return {
      success: false,
      status: 409,
      error: "An account with that email already exists",
    };
  }

  if (password !== confirm) {
    return {
      success: false,
      status: 400,
      error: "Passwords do not match",
    };
  }

  const newUser = UserRepository.create({ name, email, password, confirm });

  return {
    success: true,
    status: 200,
    data: { user: { id: newUser.id, name: newUser.name, email: newUser.email } },
  };
}
