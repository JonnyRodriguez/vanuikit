// ssg-poc/src/client.ts
/**
 * Entry del bundle del navegador (takeover del HTML estático).
 *
 * Orden crítico: loadPayload() ANTES de boot() — los seeds deben existir
 * cuando las fábricas de ruta creen las queries, para que el primer render
 * ya salga con datos (sin skeleton) y el remount sea idéntico al HTML.
 */
import { loadPayload } from "./data.js";
import { boot } from "./app.js";

const start = () => {
  loadPayload();
  boot();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
