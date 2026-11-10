/**
 * Example data for the demo — equivalent to PHP fixtures/seeders.
 *
 * In a real app this data would come from a database. Here
 * it is kept in memory so the demo works without an external backend.
 */

/**
 * Registered users (in-memory). The password is stored in plain
 * text ONLY for the demo — never in production.
 */
export const users = [
  {
    id: 1,
    name: "Usuario Demo",
    email: "demo@example.com",
    password: "123456",
  },
];

/**
 * Email that always fails — reproduces the original mock behavior
 * (demo.js / login.js / register.js) where fail@example.com returned an error.
 */
export const FAIL_EMAIL = "fail@example.com";
