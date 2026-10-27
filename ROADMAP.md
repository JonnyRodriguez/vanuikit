# Roadmap — VanUI

Plan de evolución de la librería. Los principios rectores viven en [AGENTS.md](./AGENTS.md):
componentes embebidos first-class, cero boilerplate, i18n inline con `t()`/`raw()`, accesibilidad
y suite de tests 100% verde antes de cerrar cualquier tarea.

---

## Estado actual (2026-10-15)

**17 componentes** en `vanui/src/components/`: Button (variantes), Badge, Field family
(TextField/EmailField/PasswordField), Form, Modal/ModalBase/SpinModal, ConfirmDialog,
SelectDropdown/DropdownMenu, DataGrid/Table, Tabs, toast, Spin, layout (AppShell/HeaderBar/
Sidebar/SidebarGroup/SidebarItem), Nav/Link, ThemeToggle, LocaleSelector, UserBadge.

**Infraestructura**: i18n inline (`t(key, default, params?)` + `raw()`) con tooling
(`i18n:collect`/`i18n:check`/`i18n:scan`/`i18n:fix`), router con guard deny-by-default,
`createAuth`, theme claro/oscuro/sistema, validators, fetch con autenticación, `loadRoutes`
(server).

---

## Fase 1 — Controles de formulario binarios ✅ *completada (2026-10-15)*

El hueco más sentible: hay Field para texto, pero ningún control binario, y los formularios
reales necesitan ambos. Los nuevos controles se integran al ecosistema `Form`/validators.

- ✅ `Checkbox` — checked/indeterminate, label con soporte reactivo, descripción, disabled.
- ✅ `Switch` — mismo contrato que Checkbox (`role="switch"`), para páginas de settings.
- ✅ `Radio` + `RadioGroup` — grupo excluyente con roving tabindex (flechas/Home/End),
  `role="radiogroup"`, opciones declarativas.
- ✅ `Textarea` — variante multilínea de Field, misma validación y misma API.
- ✅ Registro en `Form` como campos de primera clase (contrato `Field` completo vía
  `checkable.ts`).

**Criterio de cierre**: 13 tests nuevos (suite: 105 en verde), demo showcase, locales
recolectados (es/en/fr).

## Fase 2 — Feedback estático y estados de carga ✅ *completada (2026-10-15)*

`toast` y `Spin` cubren lo transitorio/indeterminado; falta lo persistente y lo determinado.

- ✅ `Alert` / `Callout` — avisos estáticos (info/success/warning/error), icono, dismissible.
- ✅ `Progress` — barra determinada/indeterminada con label y porcentaje.
- ✅ `Skeleton` — placeholders de texto, bloque y avatar con shimmer.
- ✅ `EmptyState` — icono + título + descripción + acción principal.

**Criterio de cierre**: 12 tests nuevos (suite: 117 en verde), demo showcase "Estados y
Feedback", locales recolectados (es/en/fr).

## Fase 3 — Overlay fino ✅ *completada (2026-10-15)*

Hoy se resuelve con `title` nativo o divs absolutos ad-hoc: de lo que más boilerplate suelto
genera.

- ✅ `Tooltip` — posiciones por CSS puro, delay, visible por focus (teclado), desactivado en
  touch (`hover: none`).
- ✅ `Popover` — panel flotante genérico: click alterna, click-outside y Esc cierran (con
  retorno de foco), contenido como fábrica `content(close)` que se reconstruye por apertura.
- ✅ `Drawer` / `Sheet` — paneles deslizantes por 4 lados, backdrop, focus trap (Tab no
  escapa), bloqueo de scroll (generaliza el patrón responsive del sidebar).

**Criterio de cierre**: 14 tests nuevos (suite: 131 en verde), demo showcase "Overlay fino",
lint y build de integración en verde. Sin dependencias externas: posicionamiento por CSS
(limitación documentada: un ancestro con `overflow: hidden` puede recortar el panel).

## Fase 4 — Escala y pulido ✅ *completada (2026-10-15)*

- ✅ `Combobox` — patrón WAI-ARIA completo (input que filtra al teclear, ↑/↓/Home/End/Enter/Esc
  desde el propio input, `aria-activedescendant`), enlace bidireccional y contrato `Field`
  para `Form` (valor real vía hidden input). Convive con SelectDropdown (select de botón).
- ✅ `Accordion` — single/multiple, `defaultOpen`, contenido como fábrica (bindings frescos),
  `aria-expanded`/`region`.
- ✅ `Avatar` — 4 tamaños, iniciales compartidas con UserBadge (refactor), `src` con fallback
  automático a iniciales.
- ✅ `Breadcrumbs` — anchors SPA vía el click handler global del Router, `aria-current="page"`.
- ✅ `Card` + `CardTitle` — superficie base sin padding impuesto (el consumidor decide).

**Pendiente de Fase 4**: `Pagination` standalone y `Kbd` (se evalúan con la próxima necesidad
real en la demo).

**Criterio de cierre**: 17 tests nuevos (suite: 148 en verde), demo showcase "Escala y pulido",
locales recolectados (es/en/fr).

## Fase 5 — `fmt`: la otra mitad del i18n ✅ *completada (2026-10-15)*

- ✅ `fmt.date/datetime/time/number/currency/percent/relative` sobre `Intl.*`, con el mismo
  espíritu que `t()`: reactivos al cambiar `currentLocale` (hijos/props, crear una vez fuera
  de los bindings) y `fmt.raw.*` para consumo imperativo estilo `raw()`.
- ✅ `createFmt(i18n)` para instancias aisladas + singleton global `fmt` atado a `i18n`.
- Valores aceptan `Date | number | ISO string`; fechas inválidas → `""` sin excepciones.

**Criterio de cierre**: 12 tests nuevos (suite: 160 en verde), tarjeta de demo con
reformateo en vivo al cambiar de idioma.

---

## 🎉 Roadmap original completado

Las 5 fases están entregadas el mismo día (2026-10-15), con la suite siempre en verde:
**21 componentes + fmt**, cero dependencias de runtime más allá de `vanjs-core` (Ciclo 2 suma Pagination, Kbd, Combobox multiple y la capa debug).

**Candidatos para un próximo ciclo** (sin fecha, embebidos cuando la demo los pida):
`Pagination` standalone y `Kbd` (aplazados de Fase 4), `Combobox` multi-selección,
capa de debug (`trace`/`expectReactive`), y re-evaluar `DatePicker` si aparece una página
que lo necesite de verdad.

---

## Ciclo 2 ✅ *completado (2026-10-15)*

Los candidatos del próximo ciclo, menos `DatePicker` (sigue sin página que lo pida):

- ✅ `debug.ts` — `trace(state)` (log de cambios encadenable) y `expectReactive({ render, act,
  contains })` (detector de bindings congelados/detached para suites de test, agnóstico del
  runner; lanza Error con pistas de los gotchas).
- ✅ `Kbd` — tecla estilizada semántica (`<kbd>`).
- ✅ `Pagination` standalone — numerada con ellipsis (`pageSlots` exportada), `page`
  bidireccional, `totalPages` reactivo; convive con la paginación simple del DataGrid.
- ✅ `Combobox` `multiple` — chips removibles (click en × y Backspace con input vacío), el
  panel no se cierra al seleccionar, toggle al re-elegir; `value: State<string[]>`. Limitación
  documentada: `FormData` colapsa repetidos (leer `field.value.val`).

---

## Backlog anotado — hallazgos del ecosistema (2026-10-27)

Del review de vanjs.org y del ecosistema oficial (decisión: **anotado, sin fecha** — se
embeben cuando una página real los pida, misma filosofía de siempre):

- **Nombre — decisión: quedarse con `vanui`.** Verificado en npm (2026-10-27): `vanui` está
  LIBRE (el VanUI oficial se publica como `vanjs-ui`, vanjs.org/vanui). Rechazado `vanuix`:
  la marca "X" pertenece a VanX (oficial) — implicaría afiliación doble que no existe.
  Posicionamiento frente a `vanjs-ui`: es ~10 widgets sin ARIA ni focus management
  documentados; el nuestro es un app kit (componentes accesibles + i18n/fmt + router
  deny-by-default + auth + debug). La brecha de accesibilidad es la bandera.
- **`Await`** (idea de `vanjs-ui`) — render declarativo desde cualquier `Promise` (no solo
  fetch) con slots `Pending`/`Error`/success. Azúcar sobre un patrón que ya existe
  (`createQuery` cubre fetch; `Await` cubre promesas sueltas). Esfuerzo estimado: S.
- **`chooseDialog`** (idea de `choose` de `vanjs-ui`) — picker modal que resuelve
  `Promise<valor | null>`, sobre `Modal` + `Combobox` (con teclado y focus trap: más
  accesible que el de ellos). Complementa `confirmDialog`. Esfuerzo estimado: M.
- **Docs DX** (lejano) — cuando vanui tenga sitio/docs: preview vivo por componente
  (CodeSandbox/jsfiddle), tabla de props con defaults, formato por-componente como vanjs.org.
- **No adoptar**: bolsas de `styleOverrides` de `vanjs-ui` (nuestro modelo de tokens UnoCSS +
  props `class` ya lo cubre), `FloatingWindow` (niche, solo-mouse).

---

## Explícitamente fuera (por ahora)

- **DatePicker/Calendar** — alcance enorme (reglas de locale, teclado); merece etapa propia.
- **FileUpload** — drag-drop + a11y + progreso: proyecto aparte.
- **TreeView, CommandPalette** — niche hasta que una página real los pida.

La filosofía embedded funciona en ambos sentidos: se embebe lo que ya se repite en la demo,
no lo que *podría* repetirse.

---

## Definición de Done (por componente)

1. Implementación en `vanui/src/components/<name>.ts` con API reactiva (acepta `State` en
   props visuales, mismo contrato que el resto del catálogo).
2. i18n: todo texto visible con `t()`/`raw()`, sin strings quemados; locales recolectados con
   `i18n:collect`.
3. Tests unitarios en `vanui/tests/` ejecutables con `bun test`.
4. Demo showcase en `demo/pages` (uso real, no screenshot).
5. Estilos vía tokens de los dos `uno.js` (sin colores hardcodeados; mismos tokens en vanui y
   demo).
6. Suite `bun test` 100% verde.
7. Exportado desde `vanui` (index.ts) y documentado en el catálogo de AGENTS.md.
