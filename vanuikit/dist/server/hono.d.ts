import type { BaseUser, Session, SessionStore } from "./session.js";
export interface HonoAuthVariables<TUser extends BaseUser = BaseUser> {
    user: TUser;
    session: Session<TUser>;
}
export interface AuthMiddlewareOptions<TUser extends BaseUser = BaseUser> {
    sessionStore: SessionStore<TUser>;
    cookieName?: string;
    unauthorizedMessage?: string;
}
export declare function createAuthMiddleware<TUser extends BaseUser = BaseUser>(options: AuthMiddlewareOptions<TUser>): import("hono").MiddlewareHandler<{
    Variables: HonoAuthVariables<TUser>;
}, string, {}, Response>;
export declare function getSessionFromHonoContext<TUser extends BaseUser = BaseUser>(c: any, sessionStore: SessionStore<TUser>, cookieName?: string): Promise<Session<TUser> | null>;
//# sourceMappingURL=hono.d.ts.map