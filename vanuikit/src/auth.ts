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
  name?: string;
  [key: string]: unknown;
};

/** Contrato mínimo que la app implementa contra su backend. */
export type AuthApi = {
  /** Verifica la sesión actual — se llama al arrancar la app. */
  me: () => Promise<{ user: AuthUser | null; token?: string | null }>;
  login: (email: string, password: string) => Promise<{ user: AuthUser; token?: string | null }>;
  register?: (data: Record<string, unknown>) => Promise<{ user: AuthUser; token?: string | null }>;
  logout: () => Promise<void> | void;
};

/** Estado de la sesión: para saber si la app ya verificó. */
export type AuthStatus = "idle" | "checking" | "authenticated" | "unauthenticated";

/** Opciones opcionales para createAuth */
export interface AuthOptions {
  /** Llave para persistir el token en localStorage (por defecto 'session_token', pasar null o false para desactivar) */
  storageKey?: string | null;
}

/** Helpers de sesión que devuelve createAuth. */
export type AuthState = {
  user: State<AuthUser | null>;
  status: State<AuthStatus>;
  token: State<string | null>;
  /** Verifica la sesión contra el backend (`me`). Devuelve el usuario o null. */
  boot: () => Promise<AuthUser | null>;
  login: (email: string, password: string) => Promise<{ user: AuthUser; token?: string | null }>;
  register: (data: Record<string, unknown>) => Promise<{ user: AuthUser; token?: string | null }>;
  logout: () => Promise<void>;
  setSession: (user: AuthUser | null, token?: string | null) => void;
  getToken: () => string | null;
  isAuthenticated: () => boolean;
};

export function createAuth(api: AuthApi, options?: AuthOptions): AuthState {
  const user = van.state<AuthUser | null>(null);
  const status = van.state<AuthStatus>("idle");
  const tokenState = van.state<string | null>(null);
  const storageKey = options?.storageKey !== undefined ? options.storageKey : "session_token";

  const readPersistedToken = (): string | null => {
    if (!storageKey || typeof localStorage === "undefined") return null;
    try {
      return localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  };

  const persistToken = (tok: string | null | undefined) => {
    tokenState.val = tok || null;
    if (!storageKey || typeof localStorage === "undefined") return;
    try {
      if (tok) {
        localStorage.setItem(storageKey, tok);
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch {}
  };

  // Inicializar token desde storage si existe
  const initialToken = readPersistedToken();
  if (initialToken) {
    tokenState.val = initialToken;
  }

  let inFlightBoot: Promise<AuthUser | null> | null = null;

  const setSession = (u: AuthUser | null, tok?: string | null) => {
    user.val = u;
    status.val = u ? "authenticated" : "unauthenticated";
    if (tok !== undefined) {
      persistToken(tok);
    } else if (!u) {
      persistToken(null);
    }
  };

  const boot = async () => {
    if (inFlightBoot) {
      return inFlightBoot;
    }
    status.val = "checking";
    inFlightBoot = (async () => {
      try {
        const res = await api.me();
        user.val = res.user;
        status.val = res.user ? "authenticated" : "unauthenticated";
        if (res.token !== undefined) {
          persistToken(res.token);
        } else if (!res.user) {
          persistToken(null);
        }
        return res.user;
      } catch {
        status.val = "unauthenticated";
        persistToken(null);
        return null;
      } finally {
        inFlightBoot = null;
      }
    })();
    return inFlightBoot;
  };

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    setSession(res.user, res.token);
    return res;
  };

  const register = async (data: Record<string, unknown>) => {
    if (!api.register) {
      throw new Error("El método register no está implementado en AuthApi");
    }
    const res = await api.register(data);
    setSession(res.user, res.token);
    return res;
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setSession(null, null);
    }
  };

  return {
    user,
    status,
    token: tokenState,
    boot,
    login,
    register,
    logout,
    setSession,
    getToken: () => tokenState.val || readPersistedToken(),
    isAuthenticated: () => user.val !== null,
  };
}

/**
 * Guard para rutas privadas: usado como `beforeEnter`.
 * Si no hay sesión redirige a `redirect` (por defecto `/login`).
 * Si la verificación de sesión está en curso o pendiente, espera el boot.
 */
export function requireAuth(
  auth: Pick<AuthState, "user"> & { status?: State<AuthStatus>; boot?: () => Promise<any> },
  redirect: string = "/login",
): Guard {
  return async () => {
    if (auth.status && (auth.status.val === "idle" || auth.status.val === "checking")) {
      if (typeof auth.boot === "function") {
        await auth.boot();
      }
    }
    return auth.user.val ? true : redirect;
  };
}