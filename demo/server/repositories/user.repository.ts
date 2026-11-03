/**
 * UserRepository — user data access (in-memory mock).
 *
 * Store pattern (store/api/src/repositories/user.repository.ts): const
 * object with methods, NOT a class. The controller calls the
 * methods directly (UserRepository.findForAuth(...)) without `new`.
 *
 * In a real application these methods would hit the DB (SQL/ORM); here they read
 * and write to the `users` array from ../data.
 */
import { users, FAIL_EMAIL } from "../data/index.js";
import type { User, RegisterData } from "../types.js";

const find = (email: string) => users.find((u) => u.email === email) ?? null;

export const UserRepository = {
  /** Finds by email for login — returns the full record (includes password). */
  findForAuth(email: string): (User & { password: string }) | null {
    return find(email);
  },

  /** Finds by email (exists? — for register). */
  findByEmail(email: string): User | null {
    return find(email);
  },

  /** Creates a user (in-memory — in production it would go to the DB). */
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