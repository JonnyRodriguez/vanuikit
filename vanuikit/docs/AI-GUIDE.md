# VanUikit — Consumer & AI Onboarding Guide

> This guide is for **developers and AI coding agents** integrating `vanuikit`
> into an application. It is a condensed, practical version of the library's
> design contract — read it before writing code so you don't hit the notorious
> pitfalls (two VanJS instances, frozen reactivity, locale bugs).

---

## 0. Installation

```bash
npm add vanuikit vanjs-core
# or: bun add vanuikit vanjs-core
```

- `vanjs-core` is a **peerDependency** — the library does not bundle it, so
  your app provides the single copy.
- Link the prepackaged stylesheet once (no toolchain):
  ```html
  <link rel="stylesheet" href="node_modules/vanuikit/dist/vanuikit.css" />
  ```
  or, in JS: `import "vanuikit/styles.css"`.

---

## 1. The Single VanJS Instance (read this first)

**Rule:** the library and your app must share ONE copy of `vanjs-core`.

- Import `van` — and all your `van.state(...)` states — **from `vanuikit`**:
  ```ts
  import { van } from "vanuikit";
  const loading = van.state(false);
  ```
- ❌ **Never** `import van from "vanjs-core"` directly. Two copies = two state
  systems that don't talk to each other: bindings freeze, components go empty,
  the router doesn't react. This is the #1 time-sink.
- The library guards you:
  - If a second copy of `vanuikit` runs after the first, a console warning
    `[vanuikit] TWO copies…` appears with the fix.
  - `isOwnState` / `isForeignState` (exported) detect a `State` created by
    another copy. `installVanDebug(van)` reports a `foreign-state` diagnostic
    the moment a foreign `State` enters the UI.

---

## 2. Reactivity Rules (VanJS)

- Visual props and children accept plain values **or** `van.State` — pass the
  `State` for live updates (e.g. `Button({ disabled: canSubmit })`).
- **The container rule:** a render function passed as a function-child
  (`() => renderCalendar()`) must have **zero reactive state reads** —
  including `raw()` and `t()` inside it. If it reads reactive state, the whole
  subtree rebuilds on change; internal bindings anchored to detached nodes then
  compete for the live nodes → intermittent empty/frozen UI. **Hoist** the
  `State`/derive outside the function-child.
  - ✅ `const label = t("cal.title", "Calendar"); div(() => label.val);`
  - ❌ `div(() => t("cal.title", "Calendar").val);`
- Never store DOM nodes in `State`/derives.

---

## 3. Internationalization (i18n)

**Canonical language is English.** Zero hardcoded user-facing strings.

- `t(key, default, params?)` → returns a reactive `State<string>`; use it in
  DOM slots/props. It updates when the locale changes.
- `raw(key, default, params?)` → resolves instantly; ONLY for imperative code
  (handlers, toasts, `confirmDialog`). Never inside a render function-child.
- Locale-aware formatting: `fmt.date(...)`, `fmt.currency(...)`, etc. return a
  reactive `State<string>`; `fmt.raw.*` resolves instantly.

```ts
import { t, raw, fmt, toast } from "vanuikit";

span(t("docs.copy", "Copy"));                          // reactive
toast.success(raw("settings.saved", "Changes saved"));  // imperative
span(fmt.date(order.createdAt));
```

---

## 4. Embedded Components (no ad-hoc boilerplate)

Use the library's components instead of hand-rolling UI:
- `ThemeToggle({ theme, variant: "button" | "segmented" })`
- `LocaleSelector({ i18n, variant: "select" | "buttons" })`
- `UserBadge({ auth, onLogout })`
- `ConfirmDialog` / `confirmDialog(...)` (imperative, promise-based)
- `DataGrid({ columns, data, searchable, sortable })`
- `Tabs({ items, activeTab, onChange })`

All accept an extra `class`. See [`docs/api/`](./api/) for the full reference.

---

## 5. Session & Routing (deny-by-default)

- `createAuth({ me, login, logout })` → reactive `AuthState`; call
  `auth.boot()` at startup.
- `requireAuth(auth, "/login")` waits for `boot()` before deciding (avoids
  false redirects on reload).
- Protect by default — declare only what's public:
  ```ts
  const router = createRouter({
    guard: requireAuth(auth, "/login"),
    publicRoutes: ["/login", "/register", "/docs/*"],
  });
  ```
- Server (Hono): `loadRoutes` protects every `*.route.ts` unless it exports
  `export const meta = { public: true }`.

---

## 6. Debugging toolkit

- `trace(state, "name")` — log every change of a `State`.
- `await expectReactive({ render, act, contains })` — frozen-binding detector
  for test suites.
- `installVanDebug(van)` — dev-only instrumenter that detects silent reactivity
  violations (state/derive nesting, derives writing states, reactive
  containers) in real time.
- `bun run check:van` (in the library repo) — static scan for the same rules.

---

## 7. Quick checklist before you finish

1. `van` imported from `"vanuikit"`, never from `"vanjs-core"`.
2. No `t()`/`raw()`/`fmt()` inside function-children — hoist states.
3. No hardcoded strings — all through `t()`/`raw()`.
4. Routes and server files protected by default; public ones declared.
5. Links the stylesheet; re-theme via `--vui-*` CSS variables.
