// demo/server/repositories/session.repository.ts
import { MemorySessionStore, type Session as VanSession } from "../../../vanui/src/server/index.js";
import type { AuthUser } from "../../shared/auth.schema.js";

export type Session = VanSession<AuthUser>;

export const SessionRepository = new MemorySessionStore<AuthUser>({
  defaultTtlSeconds: 86400,
});
