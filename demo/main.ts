/**
 * Punto de entrada SPA demo.
 *
 * Inspirado en store/web/src/index.ts: monta `App()` en <div id="app">
 * al cargar el DOM. Todo el JS de la demo (router, pantallas, nav) se
 * empaqueta en un único bundle que este archivo importa.
 */
import { van } from "vanui";
import { App } from "./app.js";

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("app");
  if (root) {
    van.add(root, App());
  }
});
