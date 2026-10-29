/**
 * Punto de entrada SPA demo.
 *
 * Inspirado en store/web/src/index.ts: monta `App()` en <div id="app">
 * al cargar el DOM. Todo el JS de la demo (router, pantallas, nav) se
 * empaqueta en un único bundle que este archivo importa.
 */
import { van } from "vanui";
import { App } from "./app.js";

// Modo debug de VanJS (opcional): detecta violaciones de las reglas
// reactivas (van.state dentro de derive, contenedores reactivos, ciclos).
// Se activa con localStorage "van-debug"=1 o el parámetro ?van-debug.
if (
  typeof localStorage !== "undefined" &&
  (localStorage.getItem("van-debug") === "1" ||
    new URLSearchParams(window.location.search).has("van-debug"))
) {
  const { installVanDebug } = await import("vanui");
  const debug = installVanDebug(van);
  (window as unknown as { __vanDebug: typeof debug }).__vanDebug = debug;
  console.info("[vanui:debug] modo debug activado — localStorage van-debug=1 o ?van-debug (vista: /debug)");
}

const mount = () => {
  const root = document.getElementById("app");
  if (root) {
    van.add(root, App());
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
