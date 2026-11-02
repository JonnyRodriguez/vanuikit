/**
 * Auth — session base for the SPA.
 *
 * Pattern from the store (web/src/app.ts: user state + boot with `me()` +
 * guard on the protected view), but without the `setTimeout` hack or code
 * duplicated per app. The app only provides an `AuthApi` (how it talks to
 * the backend) and receives a reactive state + helpers:
 *
 *   const auth = createAuth({
 *     me: () => api<{ user: User | null }>("/auth/me"),
 *     login: (email, password) => api<{ user: User }>("/auth/login", { method: "POST", body: ... }),
 *     logout: () => api("/auth/logout", { method: "POST" }),
 *   });
 *
 *   // in App (boot on startup):
 *   auth.boot().then(...)
 *
 *   // on a protected route:
 *   router.add("/dashboard", () => Dashboard(), { beforeEnter: requireAuth(auth, "/login") });
 */
import van from "vanjs-core";
import type { State } from "vanjs-core";
import type { Guard } from "./router.js";

/** Session user (defined by the app; the minimum is id + email). */
export type AuthUser = {
  id: string | number;
  email: string;
  name?: string;
  [key: string]: unknown;
};

/** Minimal contract the app implements against its backend. */
export type AuthApi = {
  /** Verifies the current session — called when the app starts. */
  me: () => Promise<{ user: AuthUser | null; token?: string | null }>;
  login: (email: string, password: string) => Promise<{ user: AuthUser; token?: string | null }>;
  register?: (data: Record<string, unknown>) => Promise<{ user: AuthUser; token?: string | null }>;
  logout: () => Promise<void> | void;
};

/** Session state: to know whether the app has already verified. */
export type AuthStatus = "idle" | "checking" | "authenticated" | "unauthenticated";

/** Optional options for createAuth */
export interface AuthOptions {
  /** Key used to persist the token in localStorage (defaults to 'session_token'; pass null or false to disable) */
  storageKey?: string | null;
}

/** Session helpers returned by createAuth. */
export type AuthState = {
  user: State<AuthUser | null>;
  status: State<AuthStatus>;
  token: State<string | null>;
  /** Verifies the session against the backend (`me`). Returns the user or null. */
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

  // Initialize token from storage if present
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
      throw new Error("AuthApi does not implement register");
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
 * Guard for private routes: used as `beforeEnter`.
 * If there is no session, redirects to `redirect` (defaults to `/login`).
 * If session verification is in progress or pending, waits for the boot.
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