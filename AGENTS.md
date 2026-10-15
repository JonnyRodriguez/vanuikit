# Guía de Arquitectura, Diseño y Convenciones — VanUI

Este documento establece las reglas fundamentales de diseño, arquitectura y convenciones de código para el desarrollo y extensión de **VanUI** y sus aplicaciones.

---

## 1. Filosofía Central: Focalización y Componentes Embebidos

> **"Un sistema que ayude en la focalización: las cosas que ya conocemos deben estar definidas y embebidas."**

### Principio de Cero Boilerplate
1. **Componentes Embebidos de Primer Nivel**: Las piezas comunes de la interfaz (alternadores de tema, selectores de idioma, menús/tarjetas de usuario, diálogos de confirmación, barras de encabezado, tablas de datos, etc.) **deben residir dentro de `vanui`** como componentes reutilizables, reactivos y estilizados.
2. **Prohibido el Boilerplate Ad-Hoc en Páginas o en `app.ts`**:
   - ❌ **Incorrecto**: Escribir botones manuales con funciones `cycleTheme()`, etiquetas `<select>` nativas sin envolver, o maquetar contenedores de perfil de usuario desde cero en el orquestador de la aplicación.
   - ✅ **Correcto**: Usar los componentes embebidos de VanUI:
     - `ThemeToggle({ theme, variant: "button" | "segmented" })`
     - `LocaleSelector({ i18n, variant: "select" | "buttons" })`
     - `UserBadge({ auth, onLogout })`
     - `ConfirmDialog({ ... })` / `confirmDialog(...)`
     - `DataGrid({ columns, data, searchable, sortable })`
     - `Tabs({ items, activeTab, onChange })`

---

## 2. Guía de Diseño de Internacionalización (i18n)

### Regla Mandatoria: Cero Strings Quemados (No Hardcoded Strings)
Todo texto visible para el usuario (etiquetas de botones, títulos de páginas, placeholders de campos, mensajes de error, opciones de navegación) se escribe con las funciones `t()`/`raw()` de vanui — **llave semántica + texto por defecto, inline, sin objetos TEXTS**.

### Llamada Inline: `t(key, default, params?)`
La llave es semántica y estable (`sección.propuesta`); el texto por defecto (español) vive junto al uso, y los parámetros van al final con placeholders `{nombre}`:

```typescript
import { t, raw } from "vanui";

span(t("gateways.qrAlt", "Código QR"));
Button({}, t("components.modal.openBtn", "Abrir Modal Básico"));
toast.info(raw("gateways.saved", "Cambios guardados"));
p(t("gateways.rechargeWith", "Recargar con {name}", { name: gateway.name }));
```

- **`t()` para slots reactivos** (hijos y props de componentes): retorna `State<string>` y el texto muta al cambiar `currentLocale`.
- **`raw()` para consumo imperativo** (handlers, toasts, `confirmDialog`): resuelve al instante sin reactividad.
- **Nunca llames `t()` dentro de funciones-hija o props-función de van** (`span(() => t(...).val)`): el derive creado dentro del binding se registra como *setter* del binding contenedor y van **omite suscribir el binding** — el texto queda congelado en el idioma del montaje. En esos casos usa `raw(...)` (lee `currentLocale` directo en el binding), o iza el `State` de `t()` fuera de la función.
- La llave nunca se reescribe: puedes cambiar el default sin romper traducciones. Los diccionarios (`demo/shared/locales/*.json`) son gestionados por el tooling (`i18n:collect` / `i18n:check` / `i18n:scan` / `i18n:fix`).

### Formato locale-aware: `fmt` (fechas, números, moneda)

La otra mitad del i18n: mismos dos modos que `t()`/`raw()`, sobre `Intl.*` y atado a
`currentLocale`. Los formateadores reactivos retornan `State<string>` (crear UNA vez fuera
de bindings, igual que `t()`); `fmt.raw.*` resuelve al instante.

```typescript
import { fmt } from "vanui";

span(fmt.date(order.createdAt));              // State, se reformatea al cambiar idioma
span(fmt.currency(item.price, { currency: "EUR" }));
toast.info(`Total: ${fmt.raw.currency(total)}`); // consumo imperativo
const miFmt = createFmt(miI18n);              // instancia aislada (opcional)
```

### Consumo y Derivación Reactiva
- **Enlace directo en el DOM (Reactivo)**: pasar el `State` devuelto por `t()` como hijo o prop. Al cambiar `i18n.currentLocale`, el texto en pantalla muta automáticamente.
  ```typescript
  SidebarItem({
    href: "/gateways",
    label: t("nav.gateways", "Pasarelas"),
    icon: "💳",
    current: router.path,
  })
  ```
- **Dentro de derivaciones computadas (`van.derive`) o funciones**: usar `raw()` para obtener el string resuelto sin extraer `.val`. Como `van.derive` escucha automáticamente cualquier acceso a estados de VanJS (como `i18n.currentLocale`), la función se recalcula reactivamente al cambiar de idioma.
  ```typescript
  const getPageTitle = van.derive(() => {
    const p = router.path.val;
    if (p.startsWith("/gateways")) {
      return raw("gateways.title", "Métodos de Pago y Recarga");
    }
    return "Dashboard";
  });
  ```

---

## 3. Catálogo de Componentes Embebidos en VanUI

| Componente | Módulo | Propósito |
|---|---|---|
| `AppShell` | `vanui` | Layout estructural responsive (Sidebar + HeaderBar + Main Content). |
| `HeaderBar` | `vanui` | Barra superior con leading (hamburguesa móvil), título reactivo y zona de acciones. |
| `Sidebar`, `SidebarGroup`, `SidebarItem` | `vanui` | Navegación lateral con soporte para badges, íconos y estados activos. |
| `Link`, `Nav` | `vanui` | Navegación declarativa SPA: anclas sin recarga (`Link`, con variantes) y menú horizontal reactivo (`Nav`) con estado activo por subruta y `aria-current`; ambos respetan Ctrl/Cmd+click, `target` y enlaces externos. |
| `ThemeToggle` | `vanui` | Botón o selector segmentado para alternar Claro / Oscuro / Sistema sincronizado con `<html>`. |
| `LocaleSelector` | `vanui` | Selector o pastillas de idioma con autodetección de diccionarios y banderas. |
| `UserBadge` | `vanui` | Tarjeta de usuario con avatar/iniciales, nombre, email, estado de sesión y botón de cierre. |
| `DataGrid` / `Table` | `vanui` | Tablas de datos con ordenamiento reactivo por columnas, búsqueda y paginación. |
| `Tabs` | `vanui` | Pestañas accesibles con navegación por teclado (←/→/Home/End) y soporte para badges. |
| `SelectDropdown` / `DropdownMenu` | `vanui` | Selectores flotantes accesibles con listbox y menús de acciones contextuales. |
| `ConfirmDialog` / `confirmDialog` | `vanui` | Modal de confirmación imperativo basado en Promises (`async/await`). |
| `toast` | `vanui` | Notificaciones flotantes tipo snackbar con temporizador y tipos (éxito, error, info, advertencia). |
| `Alert`, `Progress`, `Skeleton`, `EmptyState` | `vanui` | Feedback estático y estados de carga: avisos persistentes por variante (dismissible), barra de progreso accesible (determinada/indeterminada, reactiva), placeholders con shimmer y estado vacío con acción. |
| `Field`, `TextField`, `EmailField`, `PasswordField`, `TextareaField` | `vanui` | Campos de formulario reactivos con validaciones en tiempo real y tipado. |
| `Checkbox`, `Switch`, `RadioGroup` | `vanui` | Controles binarios y de elección excluyente, accesibles (Space, flechas, `role="switch"`/`radiogroup`), con `checked`/`value` como `State` bidireccional e integración nativa a `Form` (implementan el contrato `Field`). Usar `.dom()` al insertarlos como hijos. |
| `Form` | `vanui` | Contenedor de formulario con validación automática y prevención de submits inválidos. |
| `Modal`, `ModalBase`, `SpinModal` | `vanui` | Diálogos modales accesibles con backdrop y bloqueo de scroll. |
| `Tooltip`, `Popover`, `Drawer` | `vanui` | Overlay fino sin dependencias: tooltips por hover/focus (off en touch), paneles flotantes con click-outside/Esc y fábrica `content(close)`, drawers por 4 lados con backdrop, focus trap y bloqueo de scroll. |
| `Combobox` | `vanui` | Select con búsqueda estilo WAI-ARIA (input filtra al teclear, ↑/↓/Home/End/Enter/Esc, `aria-activedescendant`), `value` bidireccional e integración a `Form` (`.dom()` como hijo). Con `multiple: true`: chips removibles y `value: State<string[]>` (leer `field.value.val`: `FormData` colapsa repetidos). |
| `Accordion` | `vanui` | Acordeón single/multiple con contenido como fábrica (se reconstruye en cada apertura) y semántica `aria-expanded`/`region`. |
| `Avatar` | `vanui` | Iniciales con fallback automático desde `src` (comparte `getInitials` con UserBadge); 4 tamaños. |
| `Breadcrumbs` | `vanui` | Ruta de navegación con anchors SPA y `aria-current="page"` en el último ítem. |
| `Card` / `CardTitle` | `vanui` | Superficie base sin padding impuesto; `hoverable` para tarjetas clickeables. |
| `Pagination` | `vanui` | Paginación numerada standalone con ellipsis (`pageSlots`), `page` bidireccional y `totalPages` reactivo. |
| `Kbd` | `vanui` | Tecla estilizada semántica (`<kbd>`) para atajos y hints de teclado. |
| `Spin` | `vanui` | Indicador de carga con spinner animado y mensaje opcional. |
| `Badge` | `vanui` | Etiquetas de estado con múltiples variantes de color y tamaño. |
| `Button`, `PrimaryButton`, `SecondaryButton` | `vanui` | Botones accesibles con soporte para tamaños, variantes y estados de carga. |

---

## 4. Gestión de Estado y Sesión (`createAuth`)

1. **Guardia Asíncrono (`requireAuth`)**:
   - `requireAuth(auth, redirectUrl)` espera automáticamente a que `auth.boot()` termine si el estado inicial está en proceso de verificación (`idle` o `checking`), evitando redirecciones falsas al recargar la página o acceder por URL directa.
2. **Doble Persistencia de Token**:
   - Guardar el token de sesión en `localStorage` además de cookies (`credentials: "include"`) y enviarlo en el encabezado `Authorization: Bearer <token>` para garantizar compatibilidad total en iframes y entornos aislados.
3. **Deny-by-Default (rutas protegidas por defecto)**:
   - Cliente: `createRouter({ guard: requireAuth(auth, "/login"), publicRoutes: ["/login", ...] })`. Toda ruta nueva queda protegida sin escribir nada; **solo se declara lo público** (exacto, `"/docs/*"` o RegExp).
   - Server: `loadRoutes(dir, { auth: requireAuth() })` protege cada `*.route.ts` salvo los que exporten `export const meta = { public: true };` (co-locada junto al sub-app).
   - Prohibido proteger a mano rutas que ya cubre la política por defecto; el refinamiento interno (p. ej. un endpoint sensible dentro de un archivo público) sí usa `requireAuth()` puntual.

---

## 5. Instancia Única de VanJS
- Dos copias de `vanjs-core` = dos sistemas de estado que no se hablan: la reactividad se rompe en silencio.
- Los consumidores la **declaran** en su `package.json` (satisface la peerDep y fija la versión) pero **nunca la importan directo**: toman `van` desde `vanui` (`import { van } from "vanui"`).
- El build de la demo verifica el metafile de esbuild (`check-single-vanjs.js`) y **falla** si el bundle contiene más de una copia.

---

### Depuración: `trace` y `expectReactive`

- `trace(state, "nombre")` — loguea cada cambio del State y lo devuelve para encadenar
  (solo desarrollo: agrega un listener permanente, no llamar dentro de bindings).
- `await expectReactive({ render, act, contains })` — detector de bindings congelados para
  suites: renderiza, muta, espera el microtask de van y lanza Error con pistas de los gotchas
  (hijos-función null, árboles separados, `t()` dentro de bindings). Agnóstico del runner.

## 6. Pruebas y Calidad de Código
- Todo componente nuevo debe contar con tests unitarios en `vanui/tests/` ejecutables con `bun test`.
- Mantener la suite de tests 100% en verde antes de dar por finalizada cualquier tarea.
