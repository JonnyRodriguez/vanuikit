# VanUikit — VanJS component library

VanJS components organized **from simple to complex** in a single
`components/` layer, plus **prebuilt pages and forms** in `pages/`. A
universal UI library with no backend dependencies: theming is done with
`--vui-*` CSS variables.

## Quick start

    bun add vanuikit vanjs-core

`vanjs-core` is a peerDependency: you declare it and `van` is imported from
`vanuikit` (see the [single-instance rule](#usage-consumer)).

**1. Link the stylesheet** in your `index.html` — without this step the
components render unstyled:

    <link rel="stylesheet" href="node_modules/vanuikit/dist/vanuikit.css" />

(with a bundler this also works: `import "vanuikit/styles.css"`)

**2. Render your first component:**

```ts
import { van, Button, ThemeToggle, toast } from "vanuikit";

van.add(
  document.body,
  ThemeToggle(),                                        // light/dark/system
  Button({ onclick: () => toast.success("It works!") }, "Greet"),
);
```

That's it — no CSS toolchain, no configuration. The full catalog with live
examples lives in the demo (`../demo/`, `bun run dev` → `/components`).

## Structure

    src/
    ├── index.ts                    <- public API (re-exports everything)
    ├── util.ts                     <- cx()
    ├── validators.ts               <- Validator and subclasses (Required, Email, …)
    ├── router.ts                   <- SPA: params, deny-by-default guards, redirects
    ├── auth.ts                     <- session: createAuth + requireAuth
    ├── fetch.ts                    <- reactive data: createQuery + createMutation
    ├── theme.ts                    <- reactive theme: createTheme (light, dark, system)
    ├── i18n.ts                     <- reactive i18n: t()/raw()/createI18n
    ├── fmt.ts                      <- locale-aware formatting: fmt (dates, numbers, currency)
    ├── debug.ts / debug-graph.ts   <- trace, expectReactive and the reactivity instrumenter
    ├── server/                     <- loadRoutes: deny-by-default backend routes
    ├── components/                 <- 40 components (simple → complex; see catalog)
    └── pages/                      <- prebuilt screens: LoginForm, RegisterForm
    scripts/uno.js                  <- compiles src/ classes into dist/vanuikit.css
    dist/vanuikit.css               <- published stylesheet (generated)

The demo (which consumes this package) lives separately in `../demo/` — it is
not part of the library.

## Component catalog

Each family goes from the most basic to the composed. All of them accept
`State` in their visual props (same reactive contract) plus the consumer's
extra `class`.

| Family | Components | Purpose |
|---|---|---|
| **Buttons** | `Button`, `PrimaryButton`, `SecondaryButton` | `variant` (`primary`/`secondary`/`destructive`/`ghost`), `size` (`sm`/`md`/`lg`), `block` (opt-in full width). Defaults to `type: "button"`. |
| **Fields** | `Field`, `TextField`, `EmailField`, `PasswordField`, `TextareaField` | Unit with label + control + validators + reactive error; extensible via `addValidator`. |
| **Binary controls** | `Checkbox`, `Switch`, `RadioGroup` | `checked`/`value` as two-way `State`; accessible (Space, arrows, `role="switch"`/`radiogroup`); integrate with `Form` (`.dom()`). |
| **Selection** | `Combobox`, `SelectDropdown`, `DatePicker`, `Wizard` | WAI-ARIA combobox with filtering and multiple with chips; button select; locale-aware calendar; step flow. |
| **Forms** | `Form` | Iterates its fields' validations and only calls the handler when all pass. |
| **Layout** | `AppShell`, `Sidebar`(+`Group`/`Item`), `HeaderBar`, `Card`/`CardTitle` | Responsive dashboard (drawer on mobile, collapsible sidebar on desktop), base surfaces. |
| **Data** | `Table`, `DataGrid`, `Pagination` | Typed declarative table; grid with search/sort/pagination; standalone numbered pagination. |
| **Tabs** | `Tabs`, `Accordion` | Tabs with keyboard support (←/→/Home/End) and badges; single/multiple accordion. |
| **Navigation** | `Link`, `Nav`, `Breadcrumbs` | SPA anchors without reload (Ctrl/Cmd+click, `target`, external links), reactive menu with `aria-current`, breadcrumb trail. |
| **Feedback** | `Badge`, `Alert`, `Progress`, `Skeleton`, `EmptyState`, `Spin`, `SpinModal`, `toast`, `Kbd` | Status and loading states: soft labels, dismissible persistent alerts, determinate/indeterminate bar, shimmer placeholders, empty state with action, snackbar (`toast.success/error/info/warning`), styled keys. |
| **Overlay** | `Modal`/`ModalBase`, `ConfirmDialog`/`confirmDialog`, `Tooltip`, `Popover`, `Drawer`, `DropdownMenu` | Accessible modals with backdrop and focus management; imperative confirmation (`await confirmDialog(...)`); hover/focus tooltips; floating panels with click-outside/Esc; 4-side drawers with focus trap; action menus. |
| **Session & preferences** | `UserBadge`, `ThemeToggle`, `LocaleSelector`, `Avatar` | User card with logout, theme toggle (button/segmented), language selector (select/buttons), initials avatar. |
| **Foundation** | `Icon`, `Svg`/`SvgPath` | Lucide-style SVG icons with `currentColor` stroke (tinted by the theme); SVG primitives. |

**Public API of `pages/`:** `LoginForm` and `RegisterForm` (reusable
forms/views). The top-up flow (`***REMOVED***`, `qr`, `***REMOVED***`) lives in the
demo (`../demo/pages/` and `../demo/components/`), consumed only by it.

## SPA foundation

No external frameworks (no Next.js, no SvelteKit, no solid-router): the
library ships the minimum to build an SPA with a Hono backend.

**`Router`** (`router.ts`) — client-side navigation with pushState/popstate
and click interception, **params** (`/product/:id` → factory receives
`{ params }`), **guards** (`beforeEnter`) and **redirects**. The matcher is
hand-written (zero dependencies):

    import { Router } from "vanuikit";

    const router = new Router();
    router.add("/product/:id", ({ params }) => ProductScreen(params));
    router.add("/dashboard", () => Dashboard(), {
      beforeEnter: requireAuth(auth, "/login"),
    });
    router.redirect("/", "/login");
    router.setNotFound(() => NotFound());

    // mount the view (in App):
    van.add(root, router.start());

Internally it exposes `router.current` (reactive view state) and
`router.path` (reactive current route, for the Nav).

**Auth** (`auth.ts`) — session state + guard, without the `setTimeout`
hack. The app only provides an `AuthApi` (`me`, `login`, `logout`):

    const auth = createAuth({
      me: () => api<{ user: User | null }>("/auth/me"),
      login: (email, password) => api<{ user: User }>("/auth/login", { method: "POST", body: ... }),
      logout: () => api("/auth/logout", { method: "POST" }),
    });

    auth.boot();                                        // at app startup
    router.add("/dashboard", () => Dashboard(), {
      beforeEnter: requireAuth(auth, "/login"),         // route guard
    });

**Deny-by-default on both sides.** Both the `Router` and `loadRoutes` can
take a guard and apply it to EVERYTHING, leaving public only what is
explicitly declared — the programmer's mistake can no longer expose a route:

    // Client: declare what's public; everything else requires a session
    const router = createRouter({
      guard: requireAuth(auth, "/login"),
      publicRoutes: ["/login", "/register", "/docs/*"],
    });

    // Server: every *.route.ts file is protected unless it exports
    //   export const meta = { public: true };
    app.route("/", await loadRoutes("./routes", { auth: requireAuth() }));

`loadRoutes` (in `vanuikit/server`) recursively scans `*.route.ts|js` files
and mounts each sub-app following the folder hierarchy (`api/auth.route.ts` →
`/api/auth`), with deterministic ordering and an `onLoad` callback for
logging. Requires a runtime that imports the files (tsx/bun or .js routes).

## Usage (consumer)

    bun add vanuikit vanjs-core

`vanjs-core` is a **peerDependency**: the library does NOT bundle it. The
published bundle (`dist/index.js`) only imports it, so the consumer provides
the single copy — guaranteeing there are never two VanJS instances.

**Single-instance rule:** two copies of `vanjs-core` are two state systems
that don't talk to each other (reactivity silently breaks). The consumer
**declares** it in their `package.json` (pinning the version and satisfying
the peer) but **never imports it directly**: take `van` from `vanuikit`
(`import { van } from "vanuikit"`). In demos/monorepos that consume
`vanuikit` via a local path (`file:../vanuikit`), declare `vanjs-core` in
your app too (it is the peer's "host").

> ⚠️ **The most common mistake** (and the most time-consuming): following the
> vanjs.org examples and doing `import van from "vanjs-core"`. The app
> "works" but the kit's components live in another state universe — bindings
> freeze and components go empty.
>
> Two safety nets catch it:
> - **Runtime guard**: if a second copy of `vanuikit` (any path that runs
>   through it) registers after the first, the library shouts
>   `[vanuikit] TWO copies…` in the console with the fix.
> - **Dev-time provenance check**: while developing, enable `installVanDebug(van)`.
>   Whenever a `State` created by *another* copy is passed to the UI (as a
>   prop or child), a targeted `foreign-state` diagnostic pinpoints it — no
>   code changes needed in your components. Custom checks can use the exported
>   `isOwnState`/`isForeignState`.
> Don't spend an hour debugging: if you see either warning, change your imports.
> The demo build additionally verifies it statically
> (`check-single-vanjs.js`) and fails if the bundle contains more than one copy.

    import { van, Modal, EmailField, PasswordField, Form } from "vanuikit";

**Golden rule:** import `van` (and the `van.state` states) from
`"vanuikit"`, never from `"vanjs-core"` directly. If the app imports `van`
through another path (installing `vanjs-core` alongside and using it
directly, or importing it from a different copy), you get **two VanJS
instances**: bindings of one copy are NOT updated when a state of the other
changes (the router view doesn't change on navigation even though the URL
does). The demo does exactly this: all its `van` imports go through
`import { van } from "vanuikit"`.

    // ✅ right
    import { van } from "vanuikit";
    const loading = van.state(false);

    // ❌ wrong: creates a second VanJS instance → broken reactivity
    import van from "vanjs-core";

    // Each typed field is a unit: it brings its own validation.
    // Form iterates the checks and only calls the handler if all pass.
    const form = Form(async (data) => {
      // data = { email, password } — already validated by the fields
      await login(data);
    });

    const confirm = PasswordField("Confirm password", "confirm");
    confirm.addValidator(Match("password", "Passwords do not match"));

    form.add(EmailField(), PasswordField(), confirm);

    const modal = Modal();
    modal.mount();

    modal.set(
      {
        title: "Sign in",
        body: () =>
          form.dom(
            Button({ type: "submit" }, "Enter"), // goes inside the <form>
          ),
      },
      true,
    );

Available typed fields: `TextField` (required), `EmailField` (required +
format), `PasswordField` (required + minimum 6). Standalone validators:
`Required`, `Email`, `MinLength`, `Match`; added with `addValidator` without
losing the type's own.

Buttons with variant and size (defaults: `primary`, `md`):

    Button({ variant: "secondary", size: "sm" }, "Cancel");
    Button({ variant: "primary", size: "lg", type: "submit" }, "Save");

## Shell (AppShell + Sidebar)

`AppShell` builds the responsive dashboard: sliding drawer with backdrop on
mobile and, on desktop, a sidebar **anchored to the viewport**
(`sticky top-0 h-dvh`) with internal nav scroll — the `footer`
(profile/logout) stays visible even on long pages.

`Sidebar` is collapsible on desktop (icon rail):

    const collapsed = van.state(false);
    Sidebar({
      header: ...,
      content: [SidebarGroup(...), ...],
      footer: UserBadge({ auth, compact: collapsed }),  // avatar mode on the rail
      collapsible: true,        // shows the «/» button (desktop only)
      collapsed,                // controlled; without it, internal state
      storageKey: "my-sidebar", // persists to localStorage (also controlled)
    });

In rail mode labels, group titles, badges and the header are hidden; items
keep their `aria-label`. `SidebarItem`, `SidebarGroup`, `HeaderBar` and
`UserBadge` (with `compact`) complete the family.

## Theme (createTheme)

Reactive theme manager (Light / Dark / System) with no dependencies:

```ts
import { createTheme } from "vanuikit";

const theme = createTheme({
  defaultMode: "system", // "light" | "dark" | "system"
  storageKey: "my-app-theme",
});

// Methods and reactive states:
theme.setMode("dark");
theme.toggle(); // Alternates between light and dark
console.log(theme.mode.val);   // "dark"
console.log(theme.isDark.val); // true
```

It automatically applies the `.dark` class and `data-theme="dark"` to the
`<html>` element, in sync with the `--vui-*` CSS variables.

## Internationalization (createI18n)

Ultra-light reactive translation and interpolation system. The default
language is **English**; the bundled dictionaries (`field`, `dialog`,
`table`, `modal`, `dropdown`, `theme`, `nav`, `auth`, `login`, `register`)
cover the embedded components' texts:

```ts
import { createI18n } from "vanuikit";

const i18n = createI18n({
  defaultLocale: "en",
  locales: {
    en: { greeting: "Hello {name}", buttons: { save: "Save" } },
    es: { greeting: "Hola {name}", buttons: { save: "Guardar" } },
  },
});

// Reactive: inside a VanJS node it updates when the language changes
div(i18n.t("buttons.save"));
div(i18n.t("greeting", { name: "Carlos" }));

// Switch language (persists to localStorage and syncs <html lang>):
i18n.setLocale("es");
```

`addTranslations` is **reactive**: already-rendered texts re-resolve when
new dictionaries are registered (useful for per-module lazy loading):

```ts
i18n.addTranslations({
  fr: { greeting: "Bonjour {name}", buttons: { save: "Enregistrer" } },
});
```

If the locale saved in localStorage didn't exist when the instance was
created (because the app registers it later), it is re-applied automatically
upon registration.

## Locale-aware formatting (fmt)

The other half of i18n: dates, numbers, currency and percentages over
`Intl.*`, bound to `currentLocale`. Same two modes as `t()`/`raw()` — the
reactive formatters return `State<string>` (create ONCE outside bindings,
just like `t()`); `fmt.raw.*` resolves immediately:

```ts
import { fmt } from "vanuikit";

span(fmt.date(order.createdAt));                   // reformats when the language changes
span(fmt.currency(item.price, { currency: "EUR" }));
span(fmt.relative(paidAt));                        // "3 minutes ago"

toast.info(`Total: ${fmt.raw.currency(total)}`);   // imperative use (handlers)

const myFmt = createFmt(myI18n);                   // isolated instance (optional)
```

`fmt.date/datetime/time/number/currency/percent/relative` accept `Date`,
number or ISO string; invalid dates return `""` (no exceptions).

## CSS

The package generates and publishes its own stylesheet: `bun run css` scans
the `src/` classes with UnoCSS and writes `dist/vanuikit.css` (reset + theme
variables + component utilities). The consumer just links it (or imports it
via `vanuikit/styles.css`); **no UnoCSS or any toolchain needed** — the
package CSS ships precompiled:

    <link rel="stylesheet" href="node_modules/vanuikit/dist/vanuikit.css" />

## Theming

The library uses **semantic tokens** (`bg-primary`, `text-muted`,
`border-border`,…) instead of hardcoded colors. The default palette is
aligned with Tailwind CSS (the reference used by shadcn and modern kits):
`primary`/`accent` = blue-600 in light and blue-500 in dark, neutrals =
gray, `destructive` = red. `dist/vanuikit.css` defines the `--vui-*`
variables in `:root` (and `:root.dark`); to re-theme, override the ones you
want in your own CSS (loaded after):

    :root {
      --vui-primary: #0ea5e9;      /* sky instead of the default blue */
      --vui-radius-md: 0.5rem;     /* larger radii */
    }

Available tokens: `--vui-primary(-hover/-active/-fg/-shadow)`,
`--vui-secondary(-hover/-active/-fg)`, `--vui-accent(-hover/-fg)`,
`--vui-focus`, `--vui-background`, `--vui-foreground(-soft)`, `--vui-muted`,
`--vui-border`, `--vui-overlay`, `--vui-destructive(-fg)`,
`--vui-info(-fg)`, `--vui-success(-fg)`, `--vui-warning(-fg)`,
`--vui-radius-md/lg/2xl/full` and `--vui-shadow-sm/lg/xl/2xl`.

The status colors (`info`, `success`, `warning`, `destructive`) have a base
(solid backgrounds, dots, 10% tints) and a `-fg` variant: the level readable
as text over the tint in both modes (700 in light, 300 in dark). `Badge`,
`Alert` and `toast` consume them — when you re-theme, those components
follow your palette.

## Documentation

Full API reference and guides ship with the package under `docs/`:

- **API reference by family** — [`docs/api/`](./docs/api/):
  - [Form controls](./docs/api/form-controls.md) — buttons, fields, binary controls, Form, Wizard.
  - [Overlays & feedback](./docs/api/overlays-feedback.md) — modal, confirm dialog, toast, alerts, tooltip, popover, drawer, dropdown.
  - [Navigation & layout](./docs/api/navigation-layout.md) — AppShell, sidebar, nav, tabs, accordion, card.
  - [Data & selection](./docs/api/data-selection.md) — table/grid, pagination, combobox, date picker, avatar, badge, icon.
  - [Session, theme & i18n](./docs/api/session-theme-i18n.md) — theme toggle/locale selector/user badge, `createTheme`, `createI18n`, `fmt`.
  - [Core infrastructure](./docs/api/core-infrastructure.md) — auth, router, query/mutation, validators, single-instance provenance, debug tools, `vanuikit/server`.
- **[Consumer & AI onboarding guide](./docs/AI-GUIDE.md)** — the must-read before writing code: single VanJS instance, reactivity rules, i18n contract, deny-by-default routing.
- [Documentation index](./docs/README.md).

## Commands (Bun)

    bun install        # installs devDeps (vanjs-core, happy-dom, typescript, @unocss/*)
    bun run typecheck  # tsc --noEmit
    bun test           # full suite on happy-dom (32 files)
    bun run css        # generates dist/vanuikit.css from the src/ classes
    bun run bundle     # bun build src/index.ts → dist/index.js (vanjs-core external)
    bun run types      # tsc --project tsconfig.build.json → dist/*.d.ts
    bun run build      # typecheck + css + bundle + types

The demo is managed in `../demo/` (bun workspace, depends on
`"vanuikit": "workspace:*"` and `vanjs-core`, the peer host):
`bun run dev` (build + server) or `bun run start` → http://localhost:3000.

The reactivity debug system (`trace`, `expectReactive`, `installVanDebug`,
the `/debug` view and the `check:van` scan) is documented in
[`DEBUG_REACTIVIDAD.md`](../DEBUG_REACTIVIDAD.md) at the repo root.
