// vanuikit/src/server/session.ts
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

export function generateSessionToken(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${crypto.randomUUID().replace(/-/g, "")}${Date.now().toString(36)}`;
  }
  return `sess_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export class MemorySessionStore<TUser extends BaseUser = BaseUser> implements SessionStore<TUser> {
  private sessions: Map<string, Session<TUser>> = new Map();
  private defaultTtlSeconds: number;

  constructor(options: SessionStoreOptions = {}) {
    this.defaultTtlSeconds = options.defaultTtlSeconds ?? 86400;
  }

  create(user: TUser, ttlSeconds?: number): Session<TUser> {
    const ttl = ttlSeconds ?? this.defaultTtlSeconds;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl * 1000);
    const userId = user.id;

    const session: Session<TUser> = {
      token: generateSessionToken(),
      userId,
      user,
      createdAt: now,
      expiresAt,
    };

    this.sessions.set(session.token, session);
    return session;
  }

  get(token: string): Session<TUser> | null {
    if (!token) return null;
    const session = this.sessions.get(token);
    if (!session) return null;

    if (new Date() > session.expiresAt) {
      this.sessions.delete(token);
      return null;
    }

    return session;
  }

  delete(token: string): boolean {
    return this.sessions.delete(token);
  }

  deleteByUser(userId: string | number): number {
    let count = 0;
    for (const [token, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(token);
        count++;
      }
    }
    return count;
  }

  cleanExpired(): number {
    const now = new Date();
    let cleaned = 0;
    for (const [token, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(token);
        cleaned++;
      }
    }
    return cleaned;
  }
}

export interface DatabaseAdapterHandlers<TUser extends BaseUser = BaseUser> {
  saveSession: (session: Session<TUser>) => Promise<void>;
  findSession: (token: string) => Promise<Session<TUser> | null>;
  deleteSession: (token: string) => Promise<boolean | void>;
  deleteUserSessions: (userId: string | number) => Promise<number | void>;
  cleanExpiredSessions?: (now: Date) => Promise<number | void>;
}

export class DatabaseSessionStore<TUser extends BaseUser = BaseUser> implements SessionStore<TUser> {
  private handlers: DatabaseAdapterHandlers<TUser>;
  private defaultTtlSeconds: number;

  constructor(handlers: DatabaseAdapterHandlers<TUser>, options: SessionStoreOptions = {}) {
    this.handlers = handlers;
    this.defaultTtlSeconds = options.defaultTtlSeconds ?? 86400;
  }

  async create(user: TUser, ttlSeconds?: number): Promise<Session<TUser>> {
    const ttl = ttlSeconds ?? this.defaultTtlSeconds;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl * 1000);
    const userId = user.id;

    const session: Session<TUser> = {
      token: generateSessionToken(),
      userId,
      user,
      createdAt: now,
      expiresAt,
    };

    await this.handlers.saveSession(session);
    return session;
  }

  async get(token: string): Promise<Session<TUser> | null> {
    if (!token) return null;
    const session = await this.handlers.findSession(token);
    if (!session) return null;

    const expiresDate = session.expiresAt instanceof Date ? session.expiresAt : new Date(session.expiresAt);
    if (new Date() > expiresDate) {
      await this.handlers.deleteSession(token);
      return null;
    }

    return session;
  }

  async delete(token: string): Promise<boolean> {
    const result = await this.handlers.deleteSession(token);
    return result !== false;
  }

  async deleteByUser(userId: string | number): Promise<number> {
    const result = await this.handlers.deleteUserSessions(userId);
    return typeof result === "number" ? result : 1;
  }

  async cleanExpired(): Promise<number> {
    if (this.handlers.cleanExpiredSessions) {
      const res = await this.handlers.cleanExpiredSessions(new Date());
      return typeof res === "number" ? res : 0;
    }
    return 0;
  }
}

export interface KVClient {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, options?: { ex?: number; ttl?: number } | any) => Promise<any>;
  del: (key: string | string[]) => Promise<any>;
}

export interface KVSessionStoreOptions extends SessionStoreOptions {
  keyPrefix?: string;
}

export class KVSessionStore<TUser extends BaseUser = BaseUser> implements SessionStore<TUser> {
  private kv: KVClient;
  private defaultTtlSeconds: number;
  private keyPrefix: string;

  constructor(kvClient: KVClient, options: KVSessionStoreOptions = {}) {
    this.kv = kvClient;
    this.defaultTtlSeconds = options.defaultTtlSeconds ?? 86400;
    this.keyPrefix = options.keyPrefix ?? "vanuikit:session:";
  }

  private getKey(token: string): string {
    return `${this.keyPrefix}${token}`;
  }

  async create(user: TUser, ttlSeconds?: number): Promise<Session<TUser>> {
    const ttl = ttlSeconds ?? this.defaultTtlSeconds;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl * 1000);
    const userId = user.id;

    const session: Session<TUser> = {
      token: generateSessionToken(),
      userId,
      user,
      createdAt: now,
      expiresAt,
    };

    const key = this.getKey(session.token);
    const value = JSON.stringify(session);
    await this.kv.set(key, value, { ex: ttl, ttl });
    return session;
  }

  async get(token: string): Promise<Session<TUser> | null> {
    if (!token) return null;
    const key = this.getKey(token);
    const raw = await this.kv.get(key);
    if (!raw) return null;

    try {
      const session = JSON.parse(raw) as Session<TUser>;
      session.createdAt = new Date(session.createdAt);
      session.expiresAt = new Date(session.expiresAt);

      if (new Date() > session.expiresAt) {
        await this.kv.del(key);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  async delete(token: string): Promise<boolean> {
    const key = this.getKey(token);
    await this.kv.del(key);
    return true;
  }

  async deleteByUser(_userId: string | number): Promise<number> {
    return 1;
  }
}
