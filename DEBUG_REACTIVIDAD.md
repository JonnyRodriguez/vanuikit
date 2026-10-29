# Debug de reactividad en VanUI

Herramientas para **detectar en el momento de la violación** las reglas reactivas
silenciosas de VanJS (las que no lanzan error y solo se manifiestan como bugs
intermitentes, p. ej. el DatePicker que no mostraba el grid al cambiar de idioma).

El sistema tiene tres piezas que se complementan:

1. **Instrumentador en runtime** (`vanui/src/debug-graph.ts`) — envuelve
   `van.state`/`van.derive` y construye el árbol de dependencias real, gritando
   con el origen exacto cuando una regla se rompe.
2. **Vista visual** (`demo/pages/debug.page.ts`, ruta `/debug`) — dibuja el
   grafo de dependencias y los diagnósticos.
3. **Escaneo estático** (`vanui/scripts/check-van-rules.ts`, `bun run check:van`)
   — la versión lexical de las reglas, para correr en CI sin ejecutar la app.

Nada de esto entra al bundle de producción: es **modo debug opt-in**.

---

## 1. Las reglas que detecta

| Código | Regla | Cómo se detecta |
|---|---|---|
| R1 | `van.state()` creado dentro de `van.derive` (o de un render). El estado se recrea en cada recálculo y pierde su identidad. | runtime + estático (A) |
| R2 | Un derive **escribe** estados durante su cómputo (feedback reactivo). | runtime |
| R2b | El derive lee y escribe el mismo estado → ciclo. | runtime |
| R3 | Un derive sin lecturas → no es reactivo (¿usa `raw()`/`t().val`?). | runtime |
| R4 | Función de render que lee estados reactivos → reconstruirá su subárbol al cambiar esos estados (la regla del contenedor). | runtime vía `trackRender` + estático (B, advertencia) |

Regla de instancia única (dos copias de `vanjs-core`) ya está cubierta por el
build de la demo (`check-single-vanjs.js`), no por estas herramientas.

---

## 2. Instrumentador runtime — `installVanDebug(van)`

Vive en `vanui/src/debug-graph.ts` y se exporta desde `"vanui"`.

```ts
import { van, installVanDebug } from "vanui";

const debug = installVanDebug(van);
// ... arrancar la app ...
debug.printTree();      // árbol en consola: derive → estados
debug.dump();           // grafo serializable { states, derives, diagnostics }
debug.diagnostics();    // diagnósticos acumulados
debug.clear();          // limpia todo (útil en tests)
debug.configure({ silent: true }); // acumula sin imprimir
```

### `trackRender` / `renderIntentional` (regla R4)

La regla del contenedor no se puede detectar sola: la lectura reactiva puede ser
intencional (rebuild a propósito, documentado en AGENTS.md). Dos helpers:

```ts
// Verificar un contenedor sospechoso: si lee estados, reporta R4.
debug.trackRender(() => miContenedor());

// Marcar como intencional: silencia R4 para esa función.
const render = debug.renderIntentional(() => leerEstadosDeliberadamente());
```

### Activación en la demo

En `demo/main.ts` el instrumentador se instala solo cuando el modo debug está
activo. Dos formas equivalentes:

- `localStorage.setItem("van-debug", "1")` y recargar.
- Abrir con el parámetro `?van-debug` en la URL.

Con el modo activo, cada violación se imprime en consola con su origen:

```
[vanui:debug] state-in-derive — van.state() creado dentro de derive "getPageTitle" — ...
  en at <anonymous> (demo/pages/foo.page.ts:42:17)
```

---

## 3. Vista visual — `/debug`

Con el modo debug activo, navegar a `/debug` (ruta pública registrada en
`demo/app.ts`) muestra:

- **Grafo SVG**: derives (columna izquierda) → estados (derecha).
  - Flecha sólida = el derive lee ese estado.
  - Flecha **discontinua roja** = el derive lo escribe durante su cómputo
    (feedback / ciclo).
  - Nodos: naranja = derive con escrituras; amarillo = derive sin deps.
- **Panel de diagnósticos**: tarjetas por regla violada con el origen exacto.
- **Botones**: “Refrescar grafo” (re-dump desde `window.__vanDebug`) y
  “Limpiar diagnósticos”.

---

## 4. Escaneo estático — `bun run check:van`

En `vanui/`:

```bash
cd vanui
bun run check:van
```

Analiza con AST todos los `.ts` de `vanui/src` y `demo` (excluye node_modules y
dist):

- **RULE A (falla, exit 1)** — `van.state()` / `van.derive()` léxicamente
  dentro de `van.derive(...)`. Ideal para CI: se detecta al escribir el código,
  no al manifestarse el bug.
- **RULE B (advertencia, exit 0)** — `t()`/`raw()`/`fmt.*()` dentro de una
  función pasada como hijo. Puede incluir casos legítimos; revisar manualmente.

Salida:

```
❌ RULE A — ../src/components/foo.ts:12:7 — van.state() creado dentro de van.derive (…)
⚠️  RULE B (revisar) — ../src/components/table.ts:209:21 — t(...) dentro de una función pasada como hijo (…)
✔ check-van-rules: 79 archivos, 0 violaciones, 37 advertencias.
```

> Nota: el escaneo es lexical (no ejecuta la app); para la detección dinámica
> usa el instrumentador (sección 2).

---

## 5. Tests

`vanui/tests/debug-graph.test.ts` cubre el instrumentador: R1, R2, R2b, R3,
R4, `renderIntentional`, idempotencia y que la semántica de VanJS se conserva
(recomputación asíncrona). Correr:

```bash
cd vanui
bun test tests/debug-graph.test.ts
```

---

## 6. Flujo de trabajo recomendado

1. **Antes de escribir código nuevo** que use `van.state`/`van.derive`/`t()`/
   `raw()`, corre `bun run check:van` — si falla RULE A, la corrección es
   inmediata y barata.
2. **Durante el desarrollo interactivo**, activa el modo debug en la demo
   (`?van-debug`) y mira la consola: cualquier violación en vivo aparece con su
   origen.
3. **Cuando aparezca un bug reactivo intermitente** (como el DatePicker):
   activa el modo debug, reproduce el bug y abre `/debug`. El grafo muestra qué
   contenedores leen estados (R4) y qué derives escriben (R2); el panel de
   diagnósticos apunta al archivo y línea.
4. Corrige (generalmente: iza el `State` fuera de la función / usa
   `renderIntentional` si es deliberado) y vuelve a correr `check:van` + tests.

---

## 7. Costo y alcance

- **Producción: cero.** El instrumentador solo se importa bajo condición en
  `demo/main.ts` (dynamic import) y no forma parte del flujo normal. Los
  helpers no tienen efectos al importarse.
- **Desarrollo: mínimo.** Una lectura extra por acceso a `.val` mientras corre
  un marco de seguimiento.
- **Limitaciones conocidas.** El runtime no detecta la regla R4 automáticamente
  en funciones-hija (hay que pasar por `trackRender`); el estático es lexical y
  puede reportar falsos positivos en RULE B (advertencia, no falla). Los bugs
  de GC de ~1s requieren tests con esperas reales (ver AGENTS.md).
