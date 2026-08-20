// server/controllers/auth.controller.ts
/**
 * AuthController — equivalente a auth.controller.php en CakePHP.
 *
 * Patrón identico a store/api/src/controllers/auth.controller.ts: cada
 * acción es un handler inline en este router Hono, la validación usa Zod
 * (schema) y el acceso a datos lo hace un repository (objeto const, sin
 * clases ni servicios).
 *
 * El apiRouter.ts monta este router en /api/auth, por lo que las rutas
 * aquí definidas se resuelven como:
 *
 *   POST /api/auth/login     -> iniciar sesion
 *   POST /api/auth/register  -> crear cuenta
 */
import { Hono } from "hono";
import { z } from "zod";
import { UserRepository, FAIL_EMAIL } from "../repositories/user.repository.js";

const auth = new Hono();

// --- Schemas Zod (validacion declarativa, como Laravel FormRequest) ---

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email(),
  password: z.string().min(1, "La contraseña es requerida"),
  confirm: z.string().min(1, "Confirma la contraseña"),
});

// --- Acciones (actions) ---

/**
 * login - POST /api/auth/login
 *
 *  200  { status: "ok" }
 *  401  { error: "Credenciales invalidas" }
 *  400  { error: "Datos invalidos", details: {...} }
 */
auth.post("/login", async (c) => {
  const body = await c.req.json();

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Datos invalidos", details: parsed.error.flatten() },
      400,
    );
  }

  const { email, password } = parsed.data;

  // Reproducción del mock original: fail@example.com siempre falla en login.
  if (email === FAIL_EMAIL) {
    return c.json({ error: "Credenciales inválidas para ese correo" }, 401);
  }

  const user = UserRepository.findForAuth(email);
  if (!user || user.password !== password) {
    return c.json({ error: "Credenciales inválidas" }, 401);
  }

  return c.json({ status: "ok" });
});

/**
 * register - POST /api/auth/register
 *
 *  200  { status: "ok" }
 *  400  { error: "Datos invalidos" } | { error: "..." }
 *  409  { error: "El email ya esta registrado" }
 */
auth.post("/register", async (c) => {
  const body = await c.req.json();

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Datos invalidos", details: parsed.error.flatten() },
      400,
    );
  }

  const { name, email, password, confirm } = parsed.data;

  // Reproducción del mock original: fail@example.com ya existe.
  if (email === FAIL_EMAIL) {
    return c.json({ error: "Ya existe una cuenta con ese correo" }, 409);
  }

  // Verificar que el email no esté registrado.
  if (UserRepository.findByEmail(email)) {
    return c.json({ error: "Ya existe una cuenta con ese correo" }, 409);
  }

  // Las contraseñas deben coincidir (el frontend también lo valida, pero el
  // backend NUNCA confía en la validación del cliente).
  if (password !== confirm) {
    return c.json({ error: "Las contraseñas no coinciden" }, 400);
  }

  UserRepository.create({ name, email, password, confirm });

  return c.json({ status: "ok" });
});

export default auth;