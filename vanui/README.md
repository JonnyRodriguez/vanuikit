# VanUI — librería de componentes VanJS

Componentes VanJS organizados **de simple a complejo** en una sola capa de
`components/`, y las **pantallas de ejemplo** (composición de componentes) en
`screens/`. Librería universal de UI, sin dependencias del backend: el tema se
personaliza con variables CSS `--vui-*`.

## Estructura

    src/
    ├── index.ts                 <- API pública (re-exporta todo)
    ├── util.ts                  <- cx()
    ├── validators.ts            <- Validator y subclases (Required, Email, …)
    ├── router.ts                <- base de SPA: navegación con params, guards y redirects
    ├── auth.ts                  <- base de sesión: createAuth + requireAuth
    ├── components/              <- de simple a complejo
    │   ├── button.ts            <-   Button (variant/size), PrimaryButton,
    │   │                            SecondaryButton
    │   ├── field.ts             <-   Input, Select, Textarea, Label y las
    │   │                            fábricas Field, TextField, EmailField,
    │   │                            PasswordField
    │   ├── form.ts              <-   Form (fábrica: itera las validaciones)
    │   ├── modal.ts             <-   ModalBase, ModalTitle, ModalClose,
    │   │                            ModalHeaderWithTitleAndClose,
    │   │                            ModalFooterWithCloseButton, Modal
    │   ├── nav.ts               <-   Nav (formato completo + aria-current)
    │   ├── spin.ts              <-   Spin
    │   └── spin-modal.ts        <-   SpinModal (contenido de modal)
    └── screens/                 <- pantallas públicas reutilizables
        ├── login.ts             <-   Formulario de inicio de sesión
        └── register.ts          <-   Formulario de registro
    ├── scripts/uno.js           <- compila las clases de src/ a dist/vanui.css
    └── dist/vanui.css           <- hoja de estilos publicada (generada)

La demo (que consume este paquete) vive aparte, en `../demo/` — no forma parte
de la librería.

## Cómo se construye (simple → complejo)

Cada familia va de lo más básico a lo compuesto:

1. **`button.ts`** — `Button` unificado con `variant` (`primary`/`secondary`)
   y `size` (`sm`/`md`/`lg`); `PrimaryButton` y `SecondaryButton` quedan como
   wrappers de compatibilidad. `Button` usa `type: "button"` por defecto
   (pasa `type: "submit"` cuando vaya dentro de un `Form`).
2. **`field.ts`** — los controles (`Input`, `Select`, `Textarea`, `Label`) y
   encima la fábrica `Field`: una unidad que lleva su label, su control, sus
   validadores y su error reactivo. Los campos tipados (`TextField`,
   `EmailField`, `PasswordField`) envuelven a `Field` y pre-registran sus
   chequeos. Se amplían con `addValidator` (patrón proxy) sin perder los del
   tipo.
3. **`validators.ts`** — la interfaz `Validator` y sus fábricas: `Required`,
   `Email`, `MinLength`, `Match` (compara con otro campo del formulario).
4. **`form.ts`** — la fábrica `Form` junta los valores, **itera por defecto las
   verificaciones de sus campos** y solo llama al handler si todas pasan.
5. **`modal.ts`** — `ModalBase` (overlay + zonas header/body/footer) y encima
   `Modal`, que ya trae título, botón de cierre y footer con "Cerrar".
6. **`nav.ts`** — `Nav` trae el formato completo (contenedor centrado, links
   accent, hover underline, activo en bold con `aria-current`); acepta
   `class` extra para ajustes del consumidor.
7. **`spin.ts` / `spin-modal.ts`** — el indicador y su contenido de modal.

**API pública de `screens/`:** `LoginForm` y `RegisterForm` (formularios
reutilizables). El flujo de recarga (`gateways`, `qr`, `recharge`,
`recharge-module`) **no** es parte de la librería: es el ejemplo de partida y
vive en la demo (`../demo/screens/`), consumido solo por ella. Úsalo como
referencia de cómo se combinan los componentes.

## Base de desarrollo SPA

Sin frameworks externos (ni Next.js, ni SvelteKit, ni solid-router): la
librería trae lo mínimo para armar una SPA con backend Hono.

**`Router`** (`router.ts`) — navegación cliente con pushState/popstate e
intercepción de clicks, **params** (`/product/:id` → facory recibe `{ params }`),
**guards** (`beforeEnter`) y **redirects**. El matcher está escrito a mano
(sin dependencias):

    import { Router } from "vanui";

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

## Uso (consumidor)

    bun add vanui vanjs-core

`vanjs-core` es una **peerDependency**: la librería NO la empaca. El bundle
publicado (`dist/index.js`) solo la importa, así que es el consumidor quien
provee la única copia — garantizando que no existan dos instancias de VanJS.
En demos/monorepos que consumen `vanui` por path local (`file:../vanui`),
declara `vanjs-core` también en tu app (es el "host" de la peer).

    import { van, Modal, EmailField, PasswordField, Form } from "vanui";

**Regla de oro:** importá `van` (y los estados `van.state`) desde `"vanui"`,
nunca desde `"vanjs-core"` directamente. Si la app importa `van` por otra ruta
(instalando `vanjs-core` a su lado y usándolo directo, o importándolo desde una
copia distinta), quedan **dos instancias** de VanJS: los bindings de una copia
NO se actualizan cuando cambia un estado de la otra (la vista del router no
cambia al navegar aunque la URL sí). La demo hace exactamente esto: todos sus
imports de `van` van por `import { van } from "vanui"`.

    // ✅ bien
    import { van } from "vanui";
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

## CSS

El paquete genera y publica su propia hoja de estilos: `bun run css` escanea
las clases de `src/` con UnoCSS y escribe `dist/vanui.css` (reset + variables
de tema + utilidades de los componentes). El consumidor solo la enlaza (o la
importa desde `vanui/styles.css`); **no necesita UnoCSS ni ninguna toolchain**
— el CSS del paquete ya viene compilado:

    <link rel="stylesheet" href="node_modules/vanui/dist/vanui.css" />

## Tema

La librería usa **tokens semánticos** (`bg-primary`, `text-muted`, `border-border`,…)
en vez de colores hardcodeados. `dist/vanui.css` define las variables `--vui-*`
en `:root`; para re-tematizar, sobreescribe las que quieras en tu propio CSS
(cargado después):

    :root {
      --vui-primary: #0ea5e9;      /* azul en vez de verde */
      --vui-radius-md: 0.5rem;     /* radios más grandes */
    }

Tokens disponibles: `--vui-primary(-hover/-active/-fg/-shadow)`, `--vui-secondary
(-hover/-active/-fg)`, `--vui-accent(-hover)`, `--vui-focus`, `--vui-background`,
`--vui-foreground(-soft)`, `--vui-muted`, `--vui-border`, `--vui-overlay`,
`--vui-destructive`, `--vui-radius-md/lg/2xl/full` y `--vui-shadow-sm/lg/xl/2xl`.

## Comandos (Bun)

    bun install        # instala devDeps (vanjs-core, happy-dom, typescript, @unocss/*)
    bun run typecheck  # tsc --noEmit
    bun test           # bun test (happy-dom: button, field, modal, spin, nav, router, auth)
    bun run css        # genera dist/vanui.css desde las clases de src/
    bun run bundle     # bun build src/index.ts → dist/index.js (vanjs-core externo)
    bun run types      # tsc --project tsconfig.build.json → dist/*.d.ts
    bun run build      # typecheck + css + bundle + types

La demo se gestiona en `../demo/` (su propio `package.json` depende de
`"vanui": "file:../vanui"` y de `vanjs-core`, el host de la peer):
`bun run build`, `bun run demo` → http://localhost:3000.
