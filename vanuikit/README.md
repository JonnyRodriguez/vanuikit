# VanUikit — librería de componentes VanJS

Componentes VanJS organizados **de simple a complejo** en una sola capa de
`components/`, y las **páginas y formularios preconstruidos** en
`pages/`. Librería universal de UI, sin dependencias del backend: el tema se
personaliza con variables CSS `--vui-*`.

## Inicio rápido

    bun add vanuikit vanjs-core

`vanjs-core` es una peerDependency: la declaras tú y el `van` se importa desde
`vanuikit` (ver [regla de instancia única](#uso-consumidor)).

**1. Enlaza la hoja de estilos** en tu `index.html` — sin este paso los
componentes se ven sin estilos:

    <link rel="stylesheet" href="node_modules/vanuikit/dist/vanuikit.css" />

(con bundler también vale: `import "vanuikit/styles.css"`)

**2. Renderiza tu primer componente:**

```ts
import { van, Button, ThemeToggle, toast } from "vanuikit";

van.add(
  document.body,
  ThemeToggle(),                                             // claro/oscuro/sistema
  Button({ onclick: () => toast.success("¡Funciona!") }, "Saludar"),
);
```

Eso es todo — sin toolchain de CSS ni configuración. El catálogo completo con
ejemplos vivos está en la demo (`../demo/`, `bun run dev` → `/components`).

## Estructura

    src/
    ├── index.ts                    <- API pública (re-exporta todo)
    ├── util.ts                     <- cx()
    ├── validators.ts               <- Validator y subclases (Required, Email, …)
    ├── router.ts                   <- SPA: params, guards deny-by-default, redirects
    ├── auth.ts                     <- sesión: createAuth + requireAuth
    ├── fetch.ts                    <- datos reactivos: createQuery + createMutation
    ├── theme.ts                    <- tema reactivo: createTheme (light, dark, system)
    ├── i18n.ts                     <- internacionalización reactiva: t()/raw()/createI18n
    ├── fmt.ts                      <- formato locale-aware: fmt (fechas, números, moneda)
    ├── debug.ts / debug-graph.ts   <- trace, expectReactive e instrumentador de reactividad
    ├── server/                     <- loadRoutes: rutas de backend deny-by-default
    ├── components/                 <- 40 componentes (de simple a complejo; ver catálogo)
    └── pages/                      <- pantallas preconstruidas: LoginForm, RegisterForm
    scripts/uno.js                  <- compila las clases de src/ a dist/vanuikit.css
    dist/vanuikit.css               <- hoja de estilos publicada (generada)

La demo (que consume este paquete) vive aparte, en `../demo/` — no forma parte
de la librería.

## Catálogo de componentes

Cada familia va de lo más básico a lo compuesto. Todos aceptan `State` en sus
props visuales (mismo contrato reactivo) y `class` extra del consumidor.

| Familia | Componentes | Propósito |
|---|---|---|
| **Botones** | `Button`, `PrimaryButton`, `SecondaryButton` | `variant` (`primary`/`secondary`/`destructive`/`ghost`), `size` (`sm`/`md`/`lg`), `block` (ancho completo opt-in). `type: "button"` por defecto. |
| **Campos** | `Field`, `TextField`, `EmailField`, `PasswordField`, `TextareaField` | Unidad con label + control + validadores + error reactivo; ampliables con `addValidator`. |
| **Controles binarios** | `Checkbox`, `Switch`, `RadioGroup` | `checked`/`value` como `State` bidireccional; accesibles (Space, flechas, `role="switch"`/`radiogroup`); integran `Form` (`.dom()`). |
| **Selección** | `Combobox`, `SelectDropdown`, `DatePicker`, `Wizard` | Combobox WAI-ARIA con filtro y múltiple con chips; select de botón; calendario locale-aware; flujo por pasos. |
| **Formularios** | `Form` | Itera las validaciones de sus campos y solo llama al handler si todas pasan. |
| **Estructura** | `AppShell`, `Sidebar`(+`Group`/`Item`), `HeaderBar`, `Card`/`CardTitle` | Dashboard responsivo (drawer en mobile, sidebar colapsable en desktop), superficies base. |
| **Datos** | `Table`, `DataGrid`, `Pagination` | Tabla declarativa tipada; grid con búsqueda/orden/paginación; paginación numerada standalone. |
| **Pestañas** | `Tabs`, `Accordion` | Pestañas con teclado (←/→/Home/End) y badges; acordeón single/multiple. |
| **Navegación** | `Link`, `Nav`, `Breadcrumbs` | Anclas SPA sin ***REMOVED*** (Ctrl/Cmd+click, `target`, externos), menú reactivo con `aria-current`, ruta de migas. |
| **Feedback** | `Badge`, `Alert`, `Progress`, `Skeleton`, `EmptyState`, `Spin`, `SpinModal`, `toast`, `Kbd` | Estados de estado y carga: etiquetas suaves, avisos persistentes dismissible, barra determinada/indeterminada, placeholders shimmer, estado vacío con acción, snackbar (`toast.success/error/info/warning`), teclas estilizadas. |
| **Overlay** | `Modal`/`ModalBase`, `ConfirmDialog`/`confirmDialog`, `Tooltip`, `Popover`, `Drawer`, `DropdownMenu` | Modales accesibles con backdrop y focus management; confirmación imperative (`await confirmDialog(...)`); tooltips hover/focus; paneles flotantes con click-outside/Esc; drawers por 4 lados con focus trap; menús de acciones. |
| **Sesión y preferencias** | `UserBadge`, `ThemeToggle`, `LocaleSelector`, `Avatar` | Tarjeta de usuario con logout, alternador de tema (button/segmented), selector de idioma (select/buttons), avatar con iniciales. |
| **Base** | `Icon`, `Svg`/`SvgPath` | Íconos SVG estilo Lucide trazo `currentColor` (se tiñen con el tema); primitivas SVG. |

**API pública de `pages/`:** `LoginForm` y `RegisterForm` (formularios/vistas
reutilizables). El flujo de ***REMOVED*** (`***REMOVED***`, `qr`, `***REMOVED***`)
vive en la demo (`../demo/pages/` y `../demo/components/`), consumido solo por ella.

## Base de desarrollo SPA

Sin frameworks externos (ni Next.js, ni SvelteKit, ni solid-router): la
librería trae lo mínimo para armar una SPA con backend Hono.

**`Router`** (`router.ts`) — navegación cliente con pushState/popstate e
intercepción de clicks, **params** (`/product/:id` → factory recibe `{ params }`),
**guards** (`beforeEnter`) y **redirects**. El matcher está escrito a mano
(sin dependencias):

    import { Router } from "vanuikit";

    const router = new Router();
    router.add("/product/:id", ({ params }) => ProductScreen(params));
    router.add("/dashboard", () => Dashboard(), {
      beforeEnter: requireAuth(auth, "/login"),
    });
    router.redirect("/", "/login");
    router.setNotFound(() => NotFound());

    // montar la vista (en App):
    van.add(root, router.start());

Internamente expone `router.current` (estado reactivo de la vista) y
`router.path` (ruta actual reactiva, para el Nav).

**Auth** (`auth.ts`) — estado de sesión + guard, sin el hack del
`setTimeout`. La app solo provee un `AuthApi` (`me`, `login`, `logout`):

    const auth = createAuth({
      me: () => api<{ user: User | null }>("/auth/me"),
      login: (email, password) => api<{ user: User }>("/auth/login", { method: "POST", body: ... }),
      logout: () => api("/auth/logout", { method: "POST" }),
    });

    auth.boot();                                        // al arrancar la app
    router.add("/dashboard", () => Dashboard(), {
      beforeEnter: requireAuth(auth, "/login"),         // guard en la ruta
    });

**Deny-by-default en ambos lados.** Tanto el `Router` como `loadRoutes`
pueden tomar un guard y aplicarlo a TODO, dejándolo solo a lo declarado
público — el error del programador ya no puede ser exponer una ruta:

    // Cliente: declara lo público; lo demás pide sesión
    const router = createRouter({
      guard: requireAuth(auth, "/login"),
      publicRoutes: ["/login", "/register", "/docs/*"],
    });

    // Server: cada archivo *.route.ts queda protegido salvo el que exporte
    //   export const meta = { public: true };
    app.route("/", await loadRoutes("./routes", { auth: requireAuth() }));

`loadRoutes` (en `vanuikit/server`) escanea `*.route.ts|js` recursivamente y
monta cada sub-app según la jerarquía de carpetas (`api/auth.route.ts` →
`/api/auth`), con orden determinista y callback `onLoad` para logging.
Requiere un runtime que importe los archivos (tsx/bun o rutas .js).

## Uso (consumidor)

    bun add vanuikit vanjs-core

`vanjs-core` es una **peerDependency**: la librería NO la empaca. El bundle
publicado (`dist/index.js`) solo la importa, así que es el consumidor quien
provee la única copia — garantizando que no existan dos instancias de VanJS.

**Regla de instancia única:** dos copias de `vanjs-core` son dos sistemas de
estado que no se hablan (la reactividad se rompe en silencio). El consumidor
la **declara** en su `package.json` (así fija la versión y satisface el peer)
pero **nunca la importa directo**: toma `van` desde `vanuikit`
(`import { van } from "vanuikit"`). El build de la demo lo verifica y falla si
el bundle contiene más de una copia.
En demos/monorepos que consumen `vanuikit` por path local (`file:../vanuikit`),
declara `vanjs-core` también en tu app (es el "host" de la peer).

    import { van, Modal, EmailField, PasswordField, Form } from "vanuikit";

**Regla de oro:** importá `van` (y los estados `van.state`) desde `"vanuikit"`,
nunca desde `"vanjs-core"` directamente. Si la app importa `van` por otra ruta
(instalando `vanjs-core` a su lado y usándolo directo, o importándolo desde una
copia distinta), quedan **dos instancias** de VanJS: los bindings de una copia
NO se actualizan cuando cambia un estado de la otra (la vista del router no
cambia al navegar aunque la URL sí). La demo hace exactamente esto: todos sus
imports de `van` van por `import { van } from "vanuikit"`.

    // ✅ bien
    import { van } from "vanuikit";
    const loading = van.state(false);

    // ❌ mal: crea una segunda instancia de VanJS → reactividad rota
    import van from "vanjs-core";

    // Cada campo tipado es una unidad: trae su validación.
    // Form itera las verificaciones y solo llama al handler si todas pasan.
    const form = Form(async (data) => {
      // data = { email, password } — ya validados por los campos
      await login(data);
    });

    const confirm = PasswordField("Confirmar contraseña", "confirm");
    confirm.addValidator(Match("password", "Las contraseñas no coinciden"));

    form.add(EmailField(), PasswordField(), confirm);

    const modal = Modal();
    modal.mount();

    modal.set(
      {
        title: "Iniciar sesión",
        body: () =>
          form.dom(
            Button({ type: "submit" }, "Entrar"), // va dentro del <form>
          ),
      },
      true,
    );

Campos tipados disponibles: `TextField` (requerido), `EmailField` (requerido +
formato), `PasswordField` (requerido + mínimo 6). Validadores sueltos:
`Required`, `Email`, `MinLength`, `Match`; se agregan con `addValidator`
sin perder los del tipo.

Botones con variante y tamaño (defaults: `primary`, `md`):

    Button({ variant: "secondary", size: "sm" }, "Cancelar");
    Button({ variant: "primary", size: "lg", type: "submit" }, "Guardar");

## Shell (AppShell + Sidebar)

`AppShell` arma el dashboard responsivo: drawer deslizante con backdrop en
mobile y, en desktop, sidebar **anclada al viewport** (`sticky top-0 h-dvh`)
con scroll interno de navegación — el `footer` (perfil/logout) queda siempre
visible aunque la página sea larga.

`Sidebar` es colapsable en desktop (rail de iconos):

    const collapsed = van.state(false);
    Sidebar({
      header: ...,
      content: [SidebarGroup(...), ...],
      footer: UserBadge({ auth, compact: collapsed }),  // modo avatar en el rail
      collapsible: true,        // muestra el botón «/» (solo desktop)
      collapsed,                // controlado; sin él, estado interno
      storageKey: "mi-sidebar", // persiste en localStorage (también controlado)
    });

En modo rail se ocultan labels, títulos de grupo, badges y el header; los
ítems conservan su `aria-label`. `SidebarItem`, `SidebarGroup`,
`HeaderBar` y `UserBadge` (con `compact`) completan la familia.

## Tema (createTheme)

Gestor reactivo de tema (Claro / Oscuro / Sistema) sin dependencias:

```ts
import { createTheme } from "vanuikit";

const theme = createTheme({
  defaultMode: "system", // "light" | "dark" | "system"
  storageKey: "my-app-theme",
});

// Métodos y estados reactivos:
theme.setMode("dark");
theme.toggle(); // Alterna entre light y dark
console.log(theme.mode.val);   // "dark"
console.log(theme.isDark.val); // true
```

Aplica automáticamente la clase `.dark` y `data-theme="dark"` al elemento `<html>`, sincronizando con las variables CSS `--vui-*`.

## Internacionalización (createI18n)

Sistema reactivo ultraligero de traducción e interpolación. El idioma por
defecto es **inglés**; los diccionarios incluidos (`field`, `dialog`, `table`,
`modal`, `dropdown`, `theme`, `nav`, `auth`, `login`, `register`) cubren los
textos de los componentes embebidos:

```ts
import { createI18n } from "vanuikit";

const i18n = createI18n({
  defaultLocale: "en",
  locales: {
    en: { greeting: "Hello {name}", buttons: { save: "Save" } },
    es: { greeting: "Hola {name}", buttons: { save: "Guardar" } },
  },
});

// Reactivo: dentro de un nodo VanJS se actualiza solo al cambiar de idioma
div(i18n.t("buttons.save"));
div(i18n.t("greeting", { name: "Carlos" }));

// Cambiar idioma (persiste en localStorage y sincroniza <html lang>):
i18n.setLocale("es");
```

`addTranslations` es **reactivo**: los textos ya renderizados se re-resuelven
al registrar diccionarios nuevos (útil para lazy loading por módulo):

```ts
i18n.addTranslations({
  fr: { greeting: "Bonjour {name}", buttons: { save: "Enregistrer" } },
});
```

Si el locale guardado en localStorage no existía al crear la instancia (porque
la app lo registra después), se re-aplica automáticamente al registrarlo.

## Formato locale-aware (fmt)

La otra mitad del i18n: fechas, números, moneda y porcentajes sobre `Intl.*`,
atados a `currentLocale`. Mismos dos modos que `t()`/`raw()` — los formatos
reactivos retornan `State<string>` (crear UNA vez fuera de los bindings, igual
que `t()`); `fmt.raw.*` resuelve al instante:

```ts
import { fmt } from "vanuikit";

span(fmt.date(order.createdAt));                   // se reformatea al cambiar el idioma
span(fmt.currency(item.price, { currency: "EUR" }));
span(fmt.relative(paidAt));                        // "hace 3 minutos"

toast.info(`Total: ${fmt.raw.currency(total)}`);   // consumo imperativo (handlers)

const miFmt = createFmt(miI18n);                   // instancia aislada (opcional)
```

`fmt.date/datetime/time/number/currency/percent/relative` aceptan `Date`,
número o ISO string; fechas inválidas retornan `""` (sin excepciones).

## CSS

El paquete genera y publica su propia hoja de estilos: `bun run css` escanea
las clases de `src/` con UnoCSS y escribe `dist/vanuikit.css` (reset + variables
de tema + utilidades de los componentes). El consumidor solo la enlaza (o la
importa desde `vanuikit/styles.css`); **no necesita UnoCSS ni ninguna toolchain**
— el CSS del paquete ya viene compilado:

    <link rel="stylesheet" href="node_modules/vanuikit/dist/vanuikit.css" />

## Tema

La librería usa **tokens semánticos** (`bg-primary`, `text-muted`, `border-border`,…)
en vez de colores hardcodeados. La paleta por defecto está alineada a Tailwind
CSS (la referencia de shadcn y los kits modernos): `primary`/`accent` = blue-600
en light y blue-500 en dark, neutrales = gray, `destructive` = red.
`dist/vanuikit.css` define las variables `--vui-*` en `:root` (y en
`:root.dark`); para re-tematizar, sobreescribe las que quieras en tu propio CSS
(cargado después):

    :root {
      --vui-primary: #0ea5e9;      /* sky en vez del azul por defecto */
      --vui-radius-md: 0.5rem;     /* radios más grandes */
    }

Tokens disponibles: `--vui-primary(-hover/-active/-fg/-shadow)`, `--vui-secondary
(-hover/-active/-fg)`, `--vui-accent(-hover/-fg)`, `--vui-focus`, `--vui-background`,
`--vui-foreground(-soft)`, `--vui-muted`, `--vui-border`, `--vui-overlay`,
`--vui-destructive(-fg)`, `--vui-info(-fg)`, `--vui-success(-fg)`,
`--vui-warning(-fg)`, `--vui-radius-md/lg/2xl/full` y `--vui-shadow-sm/lg/xl/2xl`.

Los colores de estado (`info`, `success`, `warning`, `destructive`) tienen una
base (fondos sólidos, dots, tintes al 10%) y una variante `-fg`: el nivel
legible como texto sobre el tinte en ambos modos (700 en light, 300 en dark).
`Badge`, `Alert` y `toast` los consumen — al re-tematizar esos componentes
siguen tu paleta.

## Comandos (Bun)

    bun install        # instala devDeps (vanjs-core, happy-dom, typescript, @unocss/*)
    bun run typecheck  # tsc --noEmit
    bun test           # suite completa en happy-dom (32 archivos)
    bun run css        # genera dist/vanuikit.css desde las clases de src/
    bun run bundle     # bun build src/index.ts → dist/index.js (vanjs-core externo)
    bun run types      # tsc --project tsconfig.build.json → dist/*.d.ts
    bun run build      # typecheck + css + bundle + types

La demo se gestiona en `../demo/` (workspace `bun`, depende de
`"vanuikit": "workspace:*"` y de `vanjs-core`, el host de la peer):
`bun run dev` (build + server) o `bun run start` → http://localhost:3000.

El sistema de debug de reactividad (`trace`, `expectReactive`,
`installVanDebug`, vista `/debug` y escaneo `check:van`) está documentado en
[`DEBUG_REACTIVIDAD.md`](../DEBUG_REACTIVIDAD.md) en la raíz del repo.
