import { Hono } from "hono";
import type { BaseUser, SessionStore } from "./session.js";
export interface CookieConfig {
    path?: string;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "Lax" | "Strict" | "None";
}
export interface CreateAuthRoutesOptions<TUser extends BaseUser = BaseUser> {
    sessionStore: SessionStore<TUser>;
    cookieName?: string;
    cookieOptions?: CookieConfig;
    onLogin: (credentials: Record<string, any>, c: any) => Promise<TUser | null> | TUser | null;
    onRegister?: (data: Record<string, any>, c: any) => Promise<TUser | {
        error: string;
        status?: number;
    }> | TUser | {
        error: string;
        status?: number;
    };
    onLogout?: (token: string, c: any) => Promise<void> | void;
    serializeUser?: (user: TUser) => any;
}
export declare function createAuthRoutes<TUser extends BaseUser = BaseUser>(options: CreateAuthRoutesOptions<TUser>): Hono<import("hono/types").BlankEnv, import("hono/types").BlankSchema, "/">;
//# sourceMappingURL=auth-routes.d.ts.map