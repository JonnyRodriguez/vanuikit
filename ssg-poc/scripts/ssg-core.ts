// ssg-poc/scripts/ssg-core.ts
/**
 * Núcleo del render de build: UNA URL → HTML estático completo.
 *
 * Es el corazón de la tesis de esta POC: la app se renderiza con el van
 * REAL de vanjs-core dentro de happy-dom (no hay mini-van ni reescritura de
 * componentes — el código de src/ es el mismo que bundleará el navegador).
 *
 * Este módulo se importa SIEMPRE después de registrar el DOM global
 * (GlobalRegistrator en render-page.ts, preload de bun en tests).
 */
import { installMockApi } from "./api-mock.js";
import { sleep, waitForReady } from "../src/wait.js";

const PAYLOAD_SCRIPT_ID = "ssg-data";

/**
 * Renderiza `url` a HTML completo: resuelve la ruta con el router vanui,
 * espera las queries (waitForReady), embebe el payload de datos como
 * `<script type="application/json">` y serializa el documento.
 */
export const renderToString = async (url: string): Promise<string> => {
  window.history.replaceState({}, "", url);

  const mock = installMockApi();
  const { boot } = await import("../src/app.js");
  boot();

  await waitForReady();
  await sleep(30); // margen para promesas tardías (microtasks de van)

  injectPayload(mock.served());
  return serialize();
};

/**
 * Embebe los datos servidos por la API. El escape `\u003c` evita que un
 * `</script>` dentro del JSON cierre el tag antes de tiempo.
 */
const injectPayload = (data: Record<string, unknown>) => {
  const script = document.createElement("script");
  script.id = PAYLOAD_SCRIPT_ID;
  script.type = "application/json";
  script.textContent = JSON.stringify({ data }).replace(/</g, "\\u003c");
  document.body.appendChild(script);
};

/**
 * Assets del shell, inyectados POR STRING en el HTML serializado y no como
 * nodos del DOM: si <link stylesheet> o <script module> se conectan al DOM
 * de happy-dom, éste intenta fetchearlos y lanza DOMExceptions de ruido
 * (aunque se desactive la carga de archivos en sus settings). Para el HTML
 * servido es idéntico — son boilerplate estático del shell.
 */
const HEAD_ASSETS =
  `<meta charset="utf-8">` +
  `<meta name="viewport" content="width=device-width, initial-scale=1">` +
  `<link rel="stylesheet" href="/_assets/vanui.css">` +
  `<link rel="stylesheet" href="/_assets/site.css">`;
const CLIENT_SCRIPT = `<script type="module" src="/_assets/app.js"></script>`;

const serialize = (): string => {
  const doc = document.documentElement.outerHTML;
  return `<!DOCTYPE html>\n${doc
    .replace("</head>", `${HEAD_ASSETS}</head>`)
    .replace("</body>", `${CLIENT_SCRIPT}</body>`)}`;
};
