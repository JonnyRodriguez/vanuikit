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

## Fase 4 — Escala y pulido

- `Combobox` — select con búsqueda y teclado completo (SelectDropdown se queda corto past ~15
  opciones).
- `Accordion` / `Collapsible` — single/multiple, animado, accesible.
- `Avatar` — iniciales extraídas de UserBadge, tamaños, `src` con fallback.
- `Breadcrumbs`, `Pagination` (standalone, hoy encapsulada en DataGrid), `Card`, `Kbd`.

## Fase 5 — `fmt`: la otra mitad del i18n

Si la identidad de la librería es "internacionaliza cuando quieras", fechas/números/moneda son
la mitad del i18n que aún se escribe hardcodeada.

- `fmt.date/datetime/number/currency/percent/relative` sobre `Intl.*`, con el mismo espíritu
  que `t()`: default razonable inline y resolución atada a `currentLocale`.
- Reactivos como `t()` cuando se usan como hijos/props; resolución inmediata estilo `raw()`
  para consumo imperativo.

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
