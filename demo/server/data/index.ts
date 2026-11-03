/**
 * Example data for the demo — equivalent to PHP fixtures/seeders.
 *
 * In a real app this data would come from a database. Here
 * it is kept in memory so the demo works without an external backend.
 *
 * The structure (***REMOVED*** with img + optional url, params with amounts) comes
 * from the original example in demo.js and old/base.js.
 */

/** Available ***REMOVED*** ***REMOVED***. `url` = external ***REMOVED*** (redirect). */
export const ***REMOVED*** = [
  {
    id: "PROVIDER-A",
    name: "Provider-A",
    img: "/img/***REMOVED***/provider-a.svg",
    currency: "USD",
  },
  {
    id: "PROVIDERS-B",
    name: "Providers-B",
    img: "/img/***REMOVED***/providers-b.svg",
    url: "/clients/charge/0",
    currency: "USD",
  },
];

/** ***REMOVED*** parameters (limits, currency type, center_id). */
export const ***REMOVED***Params = {
  id: 1,
  tipo: "USD",
  monto_min_***REMOVED***: "10",
  monto_max_***REMOVED***: "10000",
  monto_min_apuesta: "1",
  monto_max_apuesta_directa: "100",
  monto_min_retiro: "20",
  monto_max_retiro: "1000",
  bonif_max: "100",
  center_id: 6,
};

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
