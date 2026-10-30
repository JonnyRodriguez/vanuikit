// src/server/session.ts
function generateSessionToken() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${crypto.randomUUID().replace(/-/g, "")}${Date.now().toString(36)}`;
  }
  return `sess_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}
var MemorySessionStore = class {
  sessions = /* @__PURE__ */ new Map();
  defaultTtlSeconds;
  constructor(options = {}) {
    this.defaultTtlSeconds = options.defaultTtlSeconds ?? 86400;
  }
  create(user, ttlSeconds) {
    const ttl = ttlSeconds ?? this.defaultTtlSeconds;
    const now = /* @__PURE__ */ new Date();
    const expiresAt = new Date(now.getTime() + ttl * 1e3);
    const userId = user.id;
    const session = {
      token: generateSessionToken(),
      userId,
      user,
      createdAt: now,
      expiresAt
    };
    this.sessions.set(session.token, session);
    return session;
  }
  get(token) {
    if (!token) return null;
    const session = this.sessions.get(token);
    if (!session) return null;
    if (/* @__PURE__ */ new Date() > session.expiresAt) {
      this.sessions.delete(token);
      return null;
    }
    return session;
  }
  delete(token) {
    return this.sessions.delete(token);
  }
  deleteByUser(userId) {
    let count = 0;
    for (const [token, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(token);
        count++;
      }
    }
    return count;
  }
  cleanExpired() {
    const now = /* @__PURE__ */ new Date();
    let cleaned = 0;
    for (const [token, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(token);
        cleaned++;
      }
    }
    return cleaned;
  }
};
var DatabaseSessionStore = class {
  handlers;
  defaultTtlSeconds;
  constructor(handlers, options = {}) {
    this.handlers = handlers;
    this.defaultTtlSeconds = options.defaultTtlSeconds ?? 86400;
  }
  async create(user, ttlSeconds) {
    const ttl = ttlSeconds ?? this.defaultTtlSeconds;
    const now = /* @__PURE__ */ new Date();
    const expiresAt = new Date(now.getTime() + ttl * 1e3);
    const userId = user.id;
    const session = {
      token: generateSessionToken(),
      userId,
      user,
      createdAt: now,
      expiresAt
    };
    await this.handlers.saveSession(session);
    return session;
  }
  async get(token) {
    if (!token) return null;
    const session = await this.handlers.findSession(token);
    if (!session) return null;
    const expiresDate = session.expiresAt instanceof Date ? session.expiresAt : new Date(session.expiresAt);
    if (/* @__PURE__ */ new Date() > expiresDate) {
      await this.handlers.deleteSession(token);
      return null;
    }
    return session;
  }
  async delete(token) {
    const result = await this.handlers.deleteSession(token);
    return result !== false;
  }
  async deleteByUser(userId) {
    const result = await this.handlers.deleteUserSessions(userId);
    return typeof result === "number" ? result : 1;
  }
  async cleanExpired() {
    if (this.handlers.cleanExpiredSessions) {
      const res = await this.handlers.cleanExpiredSessions(/* @__PURE__ */ new Date());
      return typeof res === "number" ? res : 0;
    }
    return 0;
  }
};
var KVSessionStore = class {
  kv;
  defaultTtlSeconds;
  keyPrefix;
  constructor(kvClient, options = {}) {
    this.kv = kvClient;
    this.defaultTtlSeconds = options.defaultTtlSeconds ?? 86400;
    this.keyPrefix = options.keyPrefix ?? "vanuikit:session:";
  }
  getKey(token) {
    return `${this.keyPrefix}${token}`;
  }
  async create(user, ttlSeconds) {
    const ttl = ttlSeconds ?? this.defaultTtlSeconds;
    const now = /* @__PURE__ */ new Date();
    const expiresAt = new Date(now.getTime() + ttl * 1e3);
    const userId = user.id;
    const session = {
      token: generateSessionToken(),
      userId,
      user,
      createdAt: now,
      expiresAt
    };
    const key = this.getKey(session.token);
    const value = JSON.stringify(session);
    await this.kv.set(key, value, { ex: ttl, ttl });
    return session;
  }
  async get(token) {
    if (!token) return null;
    const key = this.getKey(token);
    const raw = await this.kv.get(key);
    if (!raw) return null;
    try {
      const session = JSON.parse(raw);
      session.createdAt = new Date(session.createdAt);
      session.expiresAt = new Date(session.expiresAt);
      if (/* @__PURE__ */ new Date() > session.expiresAt) {
        await this.kv.del(key);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }
  async delete(token) {
    const key = this.getKey(token);
    await this.kv.del(key);
    return true;
  }
  async deleteByUser(_userId) {
    return 1;
  }
};

// src/server/hono.ts
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
function createAuthMiddleware(options) {
  const cookieName = options.cookieName ?? "session_token";
  const unauthorizedMessage = options.unauthorizedMessage ?? "No autorizado. Inicia sesi\xF3n para acceder a este recurso.";
  return createMiddleware(async (c, next) => {
    const authHeader = c.req.header("Authorization");
    let bearerToken = null;
    if (authHeader) {
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      if (match) {
        bearerToken = match[1].trim();
      }
    }
    const cookieToken = getCookie(c, cookieName);
    const token = bearerToken || cookieToken;
    const session = token ? await Promise.resolve(options.sessionStore.get(token)) : null;
    if (!session) {
      return c.json(
        {
          error: unauthorizedMessage,
          code: "UNAUTHORIZED"
        },
        401
      );
    }
    c.set("user", session.user);
    c.set("session", session);
    await next();
  });
}
async function getSessionFromHonoContext(c, sessionStore, cookieName = "session_token") {
  const authHeader = c.req.header("Authorization");
  const bearerToken = authHeader?.replace(/^Bearer\s+/i, "").trim();
  const token = bearerToken || getCookie(c, cookieName);
  return token ? await Promise.resolve(sessionStore.get(token)) : null;
}

// src/server/auth-routes.ts
import { Hono } from "hono";
import { deleteCookie, getCookie as getCookie2, setCookie } from "hono/cookie";
function createAuthRoutes(options) {
  const router = new Hono();
  const cookieName = options.cookieName ?? "session_token";
  const serialize = options.serializeUser ?? ((user) => user);
  const authMiddleware = createAuthMiddleware({
    sessionStore: options.sessionStore,
    cookieName
  });
  const setAuthCookie = (c, token, expiresAt) => {
    setCookie(c, cookieName, token, {
      path: options.cookieOptions?.path ?? "/",
      httpOnly: options.cookieOptions?.httpOnly ?? true,
      secure: options.cookieOptions?.secure ?? process.env.NODE_ENV === "production",
      sameSite: options.cookieOptions?.sameSite ?? "Lax",
      expires: expiresAt
    });
  };
  if (options.onRegister) {
    router.post("/register", async (c) => {
      const body = await c.req.json().catch(() => ({}));
      try {
        const result = await options.onRegister(body, c);
        if (!result || "error" in result && typeof result.error === "string") {
          const err = result;
          return c.json({ error: err.error }, err.status ?? 400);
        }
        const user = result;
        const session = await options.sessionStore.create(user);
        setAuthCookie(c, session.token, session.expiresAt);
        return c.json(
          {
            user: serialize(user),
            token: session.token,
            expiresAt: session.expiresAt.toISOString()
          },
          201
        );
      } catch (err) {
        return c.json({ error: err?.message || "Error al procesar el registro" }, 400);
      }
    });
  }
  router.post("/login", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    try {
      const user = await options.onLogin(body, c);
      if (!user) {
        return c.json({ error: "Credenciales incorrectas" }, 401);
      }
      const session = await options.sessionStore.create(user);
      setAuthCookie(c, session.token, session.expiresAt);
      return c.json({
        user: serialize(user),
        token: session.token,
        expiresAt: session.expiresAt.toISOString()
      });
    } catch (err) {
      return c.json({ error: err?.message || "Error al iniciar sesi\xF3n" }, 500);
    }
  });
  router.get("/me", authMiddleware, (c) => {
    const user = c.get("user");
    return c.json({ user: serialize(user) });
  });
  router.post("/logout", async (c) => {
    const authHeader = c.req.header("Authorization");
    const bearerToken = authHeader?.replace(/^Bearer\s+/i, "").trim();
    const cookieToken = getCookie2(c, cookieName);
    const token = bearerToken || cookieToken;
    if (token) {
      await options.sessionStore.delete(token);
      if (options.onLogout) {
        await options.onLogout(token, c);
      }
    }
    deleteCookie(c, cookieName, { path: options.cookieOptions?.path ?? "/" });
    return c.json({ ok: true, message: "Sesi\xF3n cerrada correctamente" });
  });
  return router;
}

// src/server/route-loader.ts
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Hono as Hono2 } from "hono";
function withGuard(app, guard) {
  const wrapped = new Hono2();
  wrapped.use("*", guard);
  wrapped.route("/", app);
  return wrapped;
}
async function loadRoutes(routesDir, options = {}) {
  const rootApp = new Hono2();
  if (!fs.existsSync(routesDir)) {
    console.warn(`\u26A0 El directorio de rutas no existe: ${routesDir}`);
    return rootApp;
  }
  async function scanDirectory(dir, baseRoute = "") {
    const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await scanDirectory(fullPath, `${baseRoute}/${entry.name}`);
        continue;
      }
      if (!entry.isFile() || !(entry.name.endsWith(".route.ts") || entry.name.endsWith(".route.js"))) {
        continue;
      }
      const routeSegment = entry.name.replace(/\.route\.(ts|js)$/, "");
      const routePath = `${baseRoute}/${routeSegment}`.replace(/\/+/g, "/");
      try {
        const routeModule = await import(pathToFileURL(fullPath).href);
        const routeApp = routeModule.default || routeModule.route;
        if (!routeApp) {
          console.warn(`\u26A0 El archivo de ruta ${entry.name} no exporta un 'default' de Hono.`);
          continue;
        }
        const meta = routeModule.meta ?? {};
        const protectedRoute = Boolean(options.auth) && meta.public !== true;
        const mounted = protectedRoute ? withGuard(routeApp, options.auth) : routeApp;
        rootApp.route(routePath, mounted);
        options.onLoad?.({
          path: routePath,
          file: path.relative(routesDir, fullPath),
          protected: protectedRoute
        });
      } catch (error) {
        console.error(`\u274C Error al cargar la ruta ${entry.name}:`, error);
      }
    }
  }
  await scanDirectory(routesDir);
  return rootApp;
}
export {
  DatabaseSessionStore,
  KVSessionStore,
  MemorySessionStore,
  createAuthMiddleware,
  createAuthRoutes,
  generateSessionToken,
  getSessionFromHonoContext,
  loadRoutes
};
