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
    me: () => Promise<{
        user: AuthUser | null;
        token?: string | null;
    }>;
    login: (email: string, password: string) => Promise<{
        user: AuthUser;
        token?: string | null;
    }>;
    register?: (data: Record<string, unknown>) => Promise<{
        user: AuthUser;
        token?: string | null;
    }>;
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
    login: (email: string, password: string) => Promise<{
        user: AuthUser;
        token?: string | null;
    }>;
    register: (data: Record<string, unknown>) => Promise<{
        user: AuthUser;
        token?: string | null;
    }>;
    logout: () => Promise<void>;
    setSession: (user: AuthUser | null, token?: string | null) => void;
    getToken: () => string | null;
    isAuthenticated: () => boolean;
};
export declare function createAuth(api: AuthApi, options?: AuthOptions): AuthState;
/**
 * Guard para rutas privadas: usado como `beforeEnter`.
 * Si no hay sesión redirige a `redirect` (por defecto `/login`).
 * Si la verificación de sesión está en curso o pendiente, espera el boot.
 */
export declare function requireAuth(auth: Pick<AuthState, "user"> & {
    status?: State<AuthStatus>;
    boot?: () => Promise<any>;
}, redirect?: string): Guard;
//# sourceMappingURL=auth.d.ts.map