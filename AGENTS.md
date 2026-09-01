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

## 2. Guía de Diseño de Internacionalización (i18n) y Contrato `TEXTS`

### Regla Mandatoria: Cero Strings Quemados (No Hardcoded Strings)
Todo texto visible para el usuario (etiquetas de botones, títulos de páginas, placeholders de campos, mensajes de error, opciones de navegación) debe estar estructurado en diccionarios de traducción y referenciado a través del sistema de `i18n`.

### Contrato de Diseño `TEXTS`
En archivos principales u orquestadores (`app.ts`, páginas o módulos), definir un objeto constante `TEXTS` que sirva como mapa tipado de navegación de llaves:

```typescript
export const TEXTS = {
  nav: {
    gateways: "nav.gateways",
    components: "nav.components",
    login: "nav.login",
    register: "nav.register",
  },
  titles: {
    gateways: "gateways.title",
    components: "components.title",
    login: "login.title",
    register: "register.title",
  },
} as const;
```

### Derivación Reactiva
- Para enlazar textos en el DOM de VanJS, usar siempre `i18n.t(key, params, fallback)` o la función de derivación `van.derive(() => ...)` para que la interfaz se actualice de forma instantánea al cambiar el idioma sin recargar la página.
- Ejemplo:
  ```typescript
  SidebarItem({
    href: "/gateways",
    label: i18n.t(TEXTS.nav.gateways, undefined, "Pasarelas"),
    icon: "💳",
    current: router.path,
  })
  ```

---

## 3. Catálogo de Componentes Embebidos en VanUI

| Componente | Módulo | Propósito |
|---|---|---|
| `AppShell` | `vanui` | Layout estructural responsive (Sidebar + HeaderBar + Main Content). |
| `HeaderBar` | `vanui` | Barra superior con leading (hamburguesa móvil), título reactivo y zona de acciones. |
| `Sidebar`, `SidebarGroup`, `SidebarItem` | `vanui` | Navegación lateral con soporte para badges, íconos y estados activos. |
| `ThemeToggle` | `vanui` | Botón o selector segmentado para alternar Claro / Oscuro / Sistema sincronizado con `<html>`. |
| `LocaleSelector` | `vanui` | Selector o pastillas de idioma con autodetección de diccionarios y banderas. |
| `UserBadge` | `vanui` | Tarjeta de usuario con avatar/iniciales, nombre, email, estado de sesión y botón de cierre. |
| `DataGrid` / `Table` | `vanui` | Tablas de datos con ordenamiento reactivo por columnas, búsqueda y paginación. |
| `Tabs` | `vanui` | Pestañas accesibles con navegación por teclado (←/→/Home/End) y soporte para badges. |
| `SelectDropdown` / `DropdownMenu` | `vanui` | Selectores flotantes accesibles con listbox y menús de acciones contextuales. |
| `ConfirmDialog` / `confirmDialog` | `vanui` | Modal de confirmación imperativo basado en Promises (`async/await`). |
| `toast` | `vanui` | Notificaciones flotantes tipo snackbar con temporizador y tipos (éxito, error, info, advertencia). |
| `Field`, `TextField`, `EmailField`, `PasswordField` | `vanui` | Campos de formulario reactivos con validaciones en tiempo real y tipado. |
| `Form` | `vanui` | Contenedor de formulario con validación automática y prevención de submits inválidos. |
| `Modal`, `ModalBase`, `SpinModal` | `vanui` | Diálogos modales accesibles con backdrop y bloqueo de scroll. |
| `Spin` | `vanui` | Indicador de carga con spinner animado y mensaje opcional. |
| `Badge` | `vanui` | Etiquetas de estado con múltiples variantes de color y tamaño. |
| `Button`, `PrimaryButton`, `SecondaryButton` | `vanui` | Botones accesibles con soporte para tamaños, variantes y estados de carga. |

---

## 4. Gestión de Estado y Sesión (`createAuth`)

1. **Guardia Asíncrono (`requireAuth`)**:
   - `requireAuth(auth, redirectUrl)` espera automáticamente a que `auth.boot()` termine si el estado inicial está en proceso de verificación (`idle` o `checking`), evitando redirecciones falsas al recargar la página o acceder por URL directa.
2. **Doble Persistencia de Token**:
   - Guardar el token de sesión en `localStorage` además de cookies (`credentials: "include"`) y enviarlo en el encabezado `Authorization: Bearer <token>` para garantizar compatibilidad total en iframes y entornos aislados.

---

## 5. Pruebas y Calidad de Código
- Todo componente nuevo debe contar con tests unitarios en `vanui/tests/` ejecutables con `bun test`.
- Mantener la suite de tests 100% en verde antes de dar por finalizada cualquier tarea.
