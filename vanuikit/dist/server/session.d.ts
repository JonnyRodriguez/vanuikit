export interface BaseUser {
    id: string | number;
    email?: string;
    name?: string;
    [key: string]: any;
}
export interface Session<TUser extends BaseUser = BaseUser> {
    token: string;
    userId: string | number;
    user: TUser;
    createdAt: Date;
    expiresAt: Date;
}
export interface SessionStoreOptions {
    defaultTtlSeconds?: number;
}
export type MaybePromise<T> = T | Promise<T>;
export interface SessionStore<TUser extends BaseUser = BaseUser> {
    create(user: TUser, ttlSeconds?: number): MaybePromise<Session<TUser>>;
    get(token: string): MaybePromise<Session<TUser> | null>;
    delete(token: string): MaybePromise<boolean>;
    deleteByUser(userId: string | number): MaybePromise<number>;
    cleanExpired?(): MaybePromise<number>;
}
export declare function generateSessionToken(): string;
export declare class MemorySessionStore<TUser extends BaseUser = BaseUser> implements SessionStore<TUser> {
    private sessions;
    private defaultTtlSeconds;
    constructor(options?: SessionStoreOptions);
    create(user: TUser, ttlSeconds?: number): Session<TUser>;
    get(token: string): Session<TUser> | null;
    delete(token: string): boolean;
    deleteByUser(userId: string | number): number;
    cleanExpired(): number;
}
export interface DatabaseAdapterHandlers<TUser extends BaseUser = BaseUser> {
    saveSession: (session: Session<TUser>) => Promise<void>;
    findSession: (token: string) => Promise<Session<TUser> | null>;
    deleteSession: (token: string) => Promise<boolean | void>;
    deleteUserSessions: (userId: string | number) => Promise<number | void>;
    cleanExpiredSessions?: (now: Date) => Promise<number | void>;
}
export declare class DatabaseSessionStore<TUser extends BaseUser = BaseUser> implements SessionStore<TUser> {
    private handlers;
    private defaultTtlSeconds;
    constructor(handlers: DatabaseAdapterHandlers<TUser>, options?: SessionStoreOptions);
    create(user: TUser, ttlSeconds?: number): Promise<Session<TUser>>;
    get(token: string): Promise<Session<TUser> | null>;
    delete(token: string): Promise<boolean>;
    deleteByUser(userId: string | number): Promise<number>;
    cleanExpired(): Promise<number>;
}
export interface KVClient {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string, options?: {
        ex?: number;
        ttl?: number;
    } | any) => Promise<any>;
    del: (key: string | string[]) => Promise<any>;
}
export interface KVSessionStoreOptions extends SessionStoreOptions {
    keyPrefix?: string;
}
export declare class KVSessionStore<TUser extends BaseUser = BaseUser> implements SessionStore<TUser> {
    private kv;
    private defaultTtlSeconds;
    private keyPrefix;
    constructor(kvClient: KVClient, options?: KVSessionStoreOptions);
    private getKey;
    create(user: TUser, ttlSeconds?: number): Promise<Session<TUser>>;
    get(token: string): Promise<Session<TUser> | null>;
    delete(token: string): Promise<boolean>;
    deleteByUser(_userId: string | number): Promise<number>;
}
//# sourceMappingURL=session.d.ts.map