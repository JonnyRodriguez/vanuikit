/** Registra un DOM (happy-dom) con el shell mínimo (<div id="app">) para los tests. */
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register({ url: "http://localhost/" });
// Shell equivalente al index.html de producción: el contenedor donde la app monta.
document.body.innerHTML = `<div id="app"></div>`;
