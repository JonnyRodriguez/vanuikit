# ssg-poc — POC #2: sitio vanui real, pre-renderizado (SSG) para CDN

Prueba de concepto de la arquitectura **"vanui para un sitio tipo SPA + SSG
para SEO + servido desde CDN"**, con la librería **intacta**: los componentes
de `vanui` se usan tal cual (`van` real de vanjs-core, `t()`/`raw()`/`fmt`,
`createRouter`, `Link`, `Card`, `Badge`, `Button`, `createQuery`…). Es el
camino canónico del repo (reemplaza a la POC #1, eliminada, que exploró SSR
con mini-van-plate sin usar la librería).

## Cómo funciona

```
                    BUILD                                RUNTIME (CDN)
┌─────────────────────────────────────┐   ┌────────────────────────────────────┐
│ happy-dom + vanjs-core REAL         │   │ HTML estático por ruta (pretty URL)│
│  ├ fetch → mock de API (latencia)   │   │  ├ contenido completo (SEO)        │
│  ├ router vanui resuelve la ruta    │   │  ├ head: title/canonical/hreflang  │
│  ├ createQuery carga los datos      │   │  ├ <script id="ssg-data"> payload  │
│  ├ waitForReady ([data-loading])    │ ─▶│  └ <script module> app.js (25 KB)  │
│  └ serializa el DOM → index.html    │   │                                    │
└─────────────────────────────────────┘   │ takeover: app.js lee el payload    │
                                          │ (seeds) y REMONTA sobre el HTML:   │
                                          │ mismo DOM ⇒ sin flash. Reactividad │
                                          │ viva; navegación 100% SPA (router) │
                                          └────────────────────────────────────┘
```

Piezas que hacen viable el modelo:

- **Payload embebido**: lo que la API sirvió en build queda registrado
  (`scripts/api-mock.ts` → `mock.served()`) y se embebe como
  `<script type="application/json" id="ssg-data">`. El cliente lo carga
  ANTES de boot (`loadPayload()`) y las páginas hacen `q.setData(getSeed())`
  → el primer render ya tiene datos y el remount produce el mismo DOM.
- **`data-loading` como contrato de "página lista"**: las páginas conmutan
  el VALOR del atributo (`"true"`/`"false"`) — no su presencia, porque un
  prop reactivo de van que devuelve `null` escribe `"null"`, no elimina el
  atributo (gotcha verificado en `van.js`: atributos sin property setter van
  por `setAttribute` directo).
- **Subprocess por página** (`render-page.ts`): el registro del DOM global
  debe preceder a la importación de la app, y un proceso por página aísla
  los singletons (i18n, router, estados) entre rutas.
- **i18n por URL** (`/es/...`, `/en/...`): `ensureLocale()` fija el locale
  en el singleton de vanui antes de crear bindings. Los diccionarios ES y EN
  están completos: la resolución `t()` es `dict[locale] → dict[en] → default
  inline` — si faltara el dict ES, la página española saldría en inglés.
- **SITE_URL constante de build** (`define` de esbuild): canonical/hreflang
  usan el origin del despliegue, nunca el host del proceso de build (el bug
  `http://localhost` de la POC #1, corregido de raíz).
- **Head one-shot, no `van.derive`**: un derive con efecto (aplicar el head)
  sobrevive a la navegación y pisa el head de la página siguiente ante
  cambios globales (p. ej. `currentLocale`). El head de producto se aplica
  al renderizar y UNA vez cuando llega la data, con guard de ruta activa.

## Uso

```bash
bun install
npm run build        # bundle del cliente (25.4 KB) + SSG de 9 páginas + sitemap.xml
npm run preview      # CDN local: pretty URLs + /api/* + 404.html → :4200
npm test             # 7 tests (happy-dom): SEO, remount idéntico, reactividad, sitemap
npm run incremental -- teclado-mecanico   # pipeline editorial (ver abajo)
npm run typecheck
```

Rutas generadas (`dist/`):

```
es/productos/index.html          es/producto/{teclado-mecanico,mouse-gamer,monitor-27}/index.html
en/productos/index.html          en/producto/…/index.html
404.html                         index.html (índice manual para humanos)
_assets/{app.js,vanui.css,site.css}
```

Verificado en navegador real (Chromium): HTML estático renderiza con datos,
el bundle remonta sin flash, `+`/`−` reaccionan tras el takeover, la
navegación es SPA (un marcador en `window` sobrevive a los clicks — no hay
recarga) y el switch de idioma navega al otro árbol con su head correcto.

## Despliegue

`dist/` es un sitio de archivos planos: Cloudflare Pages / Netlify / S3 lo
sirven directo (pretty URLs incluidas: `dir/` → `dir/index.html`). Para
rutas de app autenticada que NO se pre-rendericen: `_redirects` hacia un
shell HTML — el deny-by-default del router de vanui encaja con esa frontera
(sólo lo público se genera, y justo sólo lo público necesita SEO).

## Pipeline incremental (publicación editorial)

Al agregar/editar un producto, no hace falta re-renderizar el sitio: el
evento editorial dispara el pipeline que regenera SOLO lo afectado y purga
el cache:

```bash
npm run incremental -- teclado-mecanico
# con purga real de Cloudflare:
CF_ZONE_ID=… CF_API_TOKEN=… npm run incremental -- teclado-mecanico
```

El conjunto afectado de un producto es **su página × locales + los
catálogos × locales** (la lista, el precio y el stock del catálogo también
quedan viejos). Después regenera `sitemap.xml` completo (barato, vive del
catálogo) y purga por URL exacta en la API de Cloudflare — sin credenciales
hace dry-run imprimiendo las URLs. Flujo completo: confirmar en DB →
`incremental` → subir `dist/` al CDN (`wrangler pages deploy dist`) → purga.
Idempotente: re-renderizar siempre es seguro; si falla, mejor no purgar.

## Simplificaciones (deliberadas, anotadas para el siguiente paso)

- **No existe "hidratación con reuso de nodos" en VanJS** — descubierto
  leyendo el fuente (`vanjs-core` 1.6, línea 139):
  `hydrate: (dom, f) => update(dom, bind(f, dom))` con
  `update = (dom, newDom) => dom.replaceWith(newDom)`. Es decir,
  `van.hydrate` RE-RENDERIZA desde cero y REEMPLAZA el árbol — un remount
  con alcance de subárbol, idéntico en naturaleza al takeover de esta POC.
  La POC #1 tampoco "conserva" el HTML del servidor: sus botones funcionan
  porque el reemplazo es invisible (render idéntico), igual que acá. El
  reuso de nodos real requeriría un renderer custom estilo mini-van
  invertido — no vale el costo: con seeds + test de identidad, el
  reemplazo es imperceptible por construcción.
- El estado interactivo no se serializa: tras el remount la cantidad vuelve
  a 1 (la POC #1 lo resolvía con `data-qty` leído en el hydrate — mismo
  reemplazo de nodos, distinta fuente del estado inicial).
- El refetch post-takeover corre sobre los seeds (stale-while-revalidate
  hecho a mano); con una API real convendría un cap de revalidación.
- Diccionarios co-ubicados en `src/i18n.ts`; en el repo real los gestiona
  el tooling (`i18n:collect`).
- Una página por subprocess es simple pero lento con cientos de rutas; un
  worker pool sería la escala.
