/**
 * Auth — base de sesión para la SPA.
 *
 * Patrón del store (web/src/app.ts: estado de usuario + boot con `me()` +
 * guard en la vista protegida), pero sin el `setTimeout` hack ni código
 * duplicado por app. La app solo provee un `AuthApi` (cómo se comunica con
 * el backend) y recibe un estado reactivo + helpers:
 *
 *   const auth = createAuth({
 *     me: () => api<{ user: User | null }>("/auth/me"),
 *     login: (email, password) => api<{ user: User }>("/auth/login", { method: "POST", body: ... }),
 *     logout: () => api("/auth/logout", { method: "POST" }),
 *   });
 *
 *   // en App (boot al arrancar):
 *   auth.boot().then(...)
 *
 *   // en una ruta protegida:
 *   router.add("/dashboard", () => Dashboard(), { beforeEnter: requireAuth(auth, "/login") });
 */
import van from "vanjs-core";
import type { State } from "vanjs-core";
import type { Guard } from "./router.js";

/** Usuario de sesión (lo define la app; el mínimo es id + email). */
export type AuthUser = {
  id: string | number;
  email: string;
  [key: string]: unknown;
};

/** Contrato mínimo que la app implementa contra su backend. */
export type AuthApi = {
  /** Verifica la sesión actual — se llama al arrancar la app. */
  me: () => Promise<{ user: AuthUser | null }>;
  login: (email: string, password: string) => Promise<{ user: AuthUser }>;
  logout: () => Promise<void> | void;
};

/** Estado de la sesión: para saber si la app ya verificó. */
export type AuthStatus = "idle" | "checking" | "authenticated" | "unauthenticated";

/** Helpers de sesión que devuelve createAuth. */
export type AuthState = {
  user: State<AuthUser | null>;
  status: State<AuthStatus>;
  /** Verifica la sesión contra el backend (`me`). Devuelve el usuario o null. */
  boot: () => Promise<AuthUser | null>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
};

export function createAuth(api: AuthApi): AuthState {
  const user = van.state<AuthUser | null>(null);
  const status = van.state<AuthStatus>("idle");

  const boot = async () => {
    status.val = "checking";
    try {
      const res = await api.me();
      user.val = res.user;
      status.val = res.user ? "authenticated" : "unauthenticated";
      return res.user;
    } catch {
      status.val = "unauthenticated";
      return null;
    }
  };

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    user.val = res.user;
    status.val = "authenticated";
  };

  const logout = async () => {
    await api.logout();
    user.val = null;
    status.val = "unauthenticated";
  };

  return {
    user,
    status,
    boot,
    login,
    logout,
    isAuthenticated: () => user.val !== null,
  };
}

/**
 * Guard para rutas privadas: usado como `beforeEnter`.
 * Si no hay sesión redirige a `redirect` (por defecto `/login`).
 */
export function requireAuth(
  auth: Pick<AuthState, "user">,
  redirect: string = "/login",
): Guard {
  return () => (auth.user.val ? true : redirect);
}