/**
 * UserRepository — acceso a datos de usuarios (mock en memoria).
 *
 * Patrón store (store/api/src/repositories/user.repository.ts): objeto
 * const con métodos, NO una clase. El controller llama directo a los
 * métodos (UserRepository.findForAuth(...)) sin `new`.
 *
 * En una aplicación real estos métodos tocarían la BD (SQL/ORM); aquí leen
 * y escriben sobre el arreglo `users` de ../data.
 */
import { users, FAIL_EMAIL } from "../data/index.js";
import type { User, RegisterData } from "../types.js";

const find = (email: string) => users.find((u) => u.email === email) ?? null;

export const UserRepository = {
  /** Busca por email para login — devuelve el registro completo (incluye password). */
  findForAuth(email: string): (User & { password: string }) | null {
    return find(email);
  },

  /** Busca por email (existe? — para register). */
  findByEmail(email: string): User | null {
    return find(email);
  },

  /** Crea un usuario (en memoria — en producción iría a la BD). */
  create(data: RegisterData): User {
    const newUser = {
      id: users.length + 1,
      name: data.name,
      email: data.email,
      password: data.password,
    };
    users.push(newUser);
    return newUser;
  },
};

export { FAIL_EMAIL };