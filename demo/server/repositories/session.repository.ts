// demo/server/repositories/session.repository.ts
/**
 * SessionRepository — Almacén de sesiones en memoria con expiración.
 */
import { randomUUID } from "node:crypto";
import type { User } from "../types.js";

export interface Session {
  id: string;
  token: string;
  userId: number | string;
  user: {
    id: number | string;
    name: string;
    email: string;
  };
  createdAt: number;
  expiresAt: number;
}

// Duración por defecto de la sesión: 24 horas
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

const sessions = new Map<string, Session>();

export const SessionRepository = {
  /**
   * Crea una nueva sesión para un usuario autenticado.
   */
  create(user: Pick<User, "id" | "name" | "email">, ttlMs: number = SESSION_TTL_MS): Session {
    const token = randomUUID();
    const now = Date.now();
    const session: Session = {
      id: token,
      token,
      userId: user.id,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      createdAt: now,
      expiresAt: now + ttlMs,
    };

    sessions.set(token, session);
    return session;
  },

  /**
   * Obtiene y valida una sesión por su token.
   */
  get(token: string): Session | null {
    if (!token) return null;

    const session = sessions.get(token);
    if (!session) return null;

    // Verificar si expiró
    if (Date.now() > session.expiresAt) {
      sessions.delete(token);
      return null;
    }

    return session;
  },

  /**
   * Elimina una sesión activa (logout).
   */
  delete(token: string): boolean {
    return sessions.delete(token);
  },

  /**
   * Limpia sesiones expiradas periódicamente.
   */
  cleanExpired(): void {
    const now = Date.now();
    for (const [token, session] of sessions.entries()) {
      if (now > session.expiresAt) {
        sessions.delete(token);
      }
    }
  },
};
