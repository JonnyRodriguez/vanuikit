/**
 * Datos de ejemplo para la demo — equivalente a los fixtures/seeders de PHP.
 *
 * En una aplicación real estos datos vendrían de una base de datos. Aquí
 * se mantienen en memoria para que el demo funcione sin backend externo.
 *
 * La estructura (gateway con img + url opcional, params con montos) proviene
 * del ejemplo original en demo.js y old/base.js.
 */

/** Pasarelas de pago disponibles. `url` = pago externo (redirección). */
export const gateways = [
  {
    id: "BINANCE",
    name: "Binance",
    img: "/img/payment/binance.svg",
    currency: "USD",
  },
  {
    id: "BANCOS",
    name: "Bancos",
    img: "/img/payment/bancos.svg",
    url: "/pay_clients/pay/0",
    currency: "USD",
  },
];

/** Parámetros de la recarga (límites, tipo de moneda, center_id). */
export const rechargeParams = {
  id: 1,
  tipo: "USD",
  monto_min_recarga: "10",
  monto_max_recarga: "10000",
  monto_min_apuesta: "1",
  monto_max_apuesta_directa: "100",
  monto_min_retiro: "20",
  monto_max_retiro: "1000",
  bonif_max: "100",
  center_id: 6,
};

/**
 * Usuarios registrados (en memoria). La contraseña se almacena en texto
 * plano SOLO para el demo — nunca en producción.
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
 * Email que siempre falla — reproduce el comportamiento del mock original
 * (demo.js / login.js / register.js) donde fail@example.com devolvía error.
 */
export const FAIL_EMAIL = "fail@example.com";
