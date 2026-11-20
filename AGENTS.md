# Architecture, Design, and Conventions Guide — VanUikit

This document establishes the fundamental rules of design, architecture, and code conventions for developing and extending **VanUikit** and its applications.

---

## 1. Core Philosophy: Focus and Embedded Components

> **"A system that aids focus: the things we already know must be defined and embedded."**

### Zero Boilerplate Principle
1. **First-Class Embedded Components**: Common interface pieces (theme toggles, language selectors, user menus/cards, confirmation dialogs, header bars, data tables, etc.) **must live inside `vanuikit`** as reusable, reactive, styled components.
2. **Ad-Hoc Boilerplate in Pages or in `app.ts` is Prohibited**:
   - ❌ **Incorrect**: Writing manual buttons with `cycleTheme()` functions, native unwrapped `<select>` labels, or hand-rolled user profile containers from scratch in the application orchestrator.
   - ✅ **Correct**: Using VanUikit's embedded components:
     - `ThemeToggle({ theme, variant: "button" | "segmented" })`
     - `LocaleSelector({ i18n, variant: "select" | "buttons" })`
     - `UserBadge({ auth, onLogout })`
     - `ConfirmDialog({ ... })` / `confirmDialog(...)`
     - `DataGrid({ columns, data, searchable, sortable })`
     - `Tabs({ items, activeTab, onChange })`

---

## 2. Internationalization (i18n) Design Guide

### Mandatory Rule: Zero Hardcoded Strings
Every user-visible text (button labels, page titles, field placeholders, error messages, navigation options) is written with vanuikit's `t()`/`raw()` functions — **semantic key + default text, inline, without TEXTS objects**. The library's canonical language is **English**: the inline default is written in English and Spanish lives as a translation (hand-maintained `es`/`fr` dictionaries; `en.json` is generated from the defaults).

### Inline Call: `t(key, default, params?)`
The key is semantic and stable (`section.proposal`); the default text (**in English**, is the canonical text that consumers without dictionaries will see) lives next to the usage, and the parameters go at the end with `{name}` placeholders:

```typescript
import { t, raw } from "vanuikit";

span(t("docs.copy", "Copy"));
Button({}, t("components.modal.openBtn", "Open Basic Modal"));
toast.info(raw("settings.saved", "Changes saved"));
p(t("greeting.withName", "Hello {name}", { name: user.name }));
```

- **`t()` for reactive slots** (children and component props): returns `State<string>` and the text mutates when `currentLocale` changes.
- **`raw()` ONLY for imperative consumption** (handlers, toasts, `confirmDialog`): resolves instantly without reactivity. **Never inside a container's render** (a function passed as a function-child): `raw()` reads `revision` and `currentLocale`, and that read becomes a dependency of the container binding → every locale change rebuilds the ENTIRE subtree. If the subtree contains node-valued states (grids, panels), the old internal bindings — anchored to detached nodes — compete with the new ones for the live node and the component ends up empty or frozen (real bug: DatePicker with an empty calendar after changing language).
- **Never call `t()` inside van function-children or function-props** (`span(() => t(...).val)`): the derive created inside the binding registers as a *setter* of the container binding and van **omits subscribing the binding** — the text freezes in the mount language. Hoist the `State` from `t()` outside the function.
- The key is never rewritten: you can change the default without breaking translations. The dictionaries (`demo/shared/locales/*.json`) are managed by the tooling (`i18n:collect` / `i18n:check` / `i18n:scan` / `i18n:fix`).

### Locale-aware formatting: `fmt` (dates, numbers, currency)

The other half of i18n: the same two modes as `t()`/`raw()`, over `Intl.*` and bound to
`currentLocale`. The reactive formatters return `State<string>` (create them ONCE outside
bindings, same as `t()`); `fmt.raw.*` resolves instantly.

```typescript
import { fmt } from "vanuikit";

span(fmt.date(order.createdAt));              // State, reformats when the language changes
span(fmt.currency(item.price, { currency: "EUR" }));
toast.info(`Total: ${fmt.raw.currency(total)}`); // imperative consumption
const miFmt = createFmt(miI18n);              // isolated instance (optional)
```

### Reactive Consumption and Derivation — the container rule

The question that solves all cases: **which binding captures this read, and what does it rebuild when it reacts?** A van binding re-executes its function when the states it read change; the read is cheap, the REBUILD is not always.

| Situation | Pattern | Why |
|---|---|---|
| Text/locale as a **leaf** of the tree | `h1(t("key", "def"))`, `span(fmt.date(x))` | leaf binding: only mutates the text |
| Immediate text **outside the render** | `raw()` in handlers, toasts, `confirmDialog` | no binding, resolves instantly |
| Label **inside a render function** (calendar, wizard-step, panel) | hoist to a top-level derive + consume `() => label.val` | the container stays WITHOUT deps: runs only once |
| Disposable subtree that MUST rebuild when X changes | read `X.val` directly in the render-fn | intentional rebuild (and without node-valued states inside) |

**The container rule**: a render function passed as a function-child (`() => renderCalendar()`) must have **zero reactive state reads** — including `raw()`, which reads `revision` and `currentLocale`. If the container reacts, it rebuilds the entire subtree: the old internal bindings stay anchored to detached nodes, accumulate on each change, and end up competing for the live nodes (van recycles bindings anchored to disconnected nodes in its ~1 s GC cycle — that's why these bugs are intermittent and tests using `flush()` don't reproduce them). Real example and its fix: `DatePicker` (labels as top-level derives).

**Never store DOM nodes in states/derives** (van rule): if two bindings consume the same node-state, both call `update()` on the same node and "one occurrence disappears".

**Direct DOM binding (Reactive)** — the most common leaf case: pass the `State` returned by `t()` as a child or prop.
  ```typescript
  SidebarItem({
    href: "/dashboard",
    label: t("nav.dashboard", "Dashboard"),
    icon: "📊",
    current: router.path,
  })
  ```
**Top-level derive with `raw()` inside** — safe: the derive lives outside any binding (never GC'd) and recalculates when `currentLocale` or anything it reads changes.
  ```typescript
  const getPageTitle = van.derive(() => {
    const p = router.path.val;
    if (p.startsWith("/dashboard")) {
      return raw("dashboard.title", "Dashboard");
    }
    return "Dashboard";
  });
  ```
**i18n regression tests**: language switches must be tested with real waits that cross van's GC cycle (~1 s) — microtask `flush()` never crosses it and doesn't reproduce these bugs.

---

## 3. Embedded Component Catalog in VanUikit

| Component | Module | Purpose |
|---|---|---|
| `AppShell` | `vanuikit` | Responsive structural layout (Sidebar + HeaderBar + Main Content). |
| `HeaderBar` | `vanuikit` | Top bar with leading (mobile hamburger), reactive title, and actions zone. |
| `Sidebar`, `SidebarGroup`, `SidebarItem` | `vanuikit` | Side navigation with support for badges, icons, and active states. |
| `Link`, `Nav` | `vanuikit` | Declarative SPA navigation: reload-free anchors (`Link`, with variants) and a reactive horizontal menu (`Nav`) with active state per sub-route and `aria-current`; both respect Ctrl/Cmd+click, `target`, and external links. |
| `ThemeToggle` | `vanuikit` | Button or segmented selector to toggle Light / Dark / System, synchronized with `<html>`. |
| `LocaleSelector` | `vanuikit` | Language selector or pills with automatic dictionary detection and flags. |
| `UserBadge` | `vanuikit` | User card with avatar/initials, name, email, session state, and sign-out button. |
| `DataGrid` / `Table` | `vanuikit` | Data tables with reactive column sorting, search, and pagination. |
| `Tabs` | `vanuikit` | Accessible tabs with keyboard navigation (←/→/Home/End) and badge support. |
| `SelectDropdown` / `DropdownMenu` | `vanuikit` | Accessible floating selectors with listbox and contextual action menus. |
| `ConfirmDialog` / `confirmDialog` | `vanuikit` | Imperative confirmation modal based on Promises (`async/await`). |
| `toast` | `vanuikit` | Floating snackbar-style notifications with timer and types (success, error, info, warning). |
| `Alert`, `Progress`, `Skeleton`, `EmptyState` | `vanuikit` | Static feedback and loading states: persistent notices per variant (dismissible), accessible progress bar (determinate/indeterminate, reactive), shimmer placeholders, and empty state with action. |
| `Field`, `TextField`, `EmailField`, `PasswordField`, `TextareaField` | `vanuikit` | Reactive form fields with real-time validation and typing. |
| `Checkbox`, `Switch`, `RadioGroup` | `vanuikit` | Accessible binary and mutually exclusive choice controls (Space, arrows, `role="switch"`/`radiogroup`), with `checked`/`value` as bidirectional `State` and native `Form` integration (they implement the `Field` contract). Use `.dom()` when inserting them as children. |
| `Form` | `vanuikit` | Form container with automatic validation and prevention of invalid submits. |
| `Await` | `vanuikit` | Declarative rendering from a Promise with loading/error/success slots; complements `createQuery` for loose promises. |
| `ChatWindow`, `createChat` | `vanuikit` | Transport-agnostic chat UI and state hook (messages, streaming text, loading/error); wire `onStream` to any transport. `openAIStream`/`createOpenAIChat` are optional helpers for OpenAI-compatible endpoints. |
| `Modal`, `ModalBase`, `SpinModal` | `vanuikit` | Accessible modal dialogs with backdrop and scroll lock. |
| `Tooltip`, `Popover`, `Drawer` | `vanuikit` | Fine overlay without dependencies: tooltips by hover/focus (off on touch), floating panels with click-outside/Esc and the `content(close)` factory, drawers on all 4 sides with backdrop, focus trap, and scroll lock. |
| `Combobox` | `vanuikit` | Searchable WAI-ARIA-style select (input filters as you type, ↑/↓/Home/End/Enter/Esc, `aria-activedescendant`), bidirectional `value`, and `Form` integration (`.dom()` as child). With `multiple: true`: removable chips and `value: State<string[]>` (read `field.value.val`: `FormData` collapses duplicates). |
| `Accordion` | `vanuikit` | Single/multiple accordion with content as a factory (rebuilds on each opening) and `aria-expanded`/`region` semantics. |
| `Tree` | `vanuikit` | Hierarchical tree of nested nodes with recursive indentation, expand/collapse (starts expanded, manual collapse persists), `role="tree"`/`aria-expanded`, a per-node `actions` slot, and an inline add-child mode (`onAddChild`) with input below the row, no modal. |
| `Avatar` | `vanuikit` | Initials with automatic fallback from `src` (shares `getInitials` with UserBadge); 4 sizes. |
| `Breadcrumbs` | `vanuikit` | Navigation path with SPA anchors and `aria-current="page"` on the last item. |
| `Card` / `CardTitle` | `vanuikit` | Base surface without imposed padding; `hoverable` for clickable cards. |
| `Pagination` | `vanuikit` | Standalone numbered pagination with ellipsis (`pageSlots`), bidirectional `page`, and reactive `totalPages`. |
| `Kbd` | `vanuikit` | Styled semantic key (`<kbd>`) for shortcuts and keyboard hints. |
| `Spin` | `vanuikit` | Loading indicator with animated spinner and optional message. |
| `Badge` | `vanuikit` | Status labels with multiple color and size variants. |
| `Button`, `PrimaryButton`, `SecondaryButton` | `vanuikit` | Accessible buttons with support for sizes, variants, and loading states. |

---

## 4. State and Session Management (`createAuth`)

1. **Async Guard (`requireAuth`)**:
   - `requireAuth(auth, redirectUrl)` automatically waits for `auth.boot()` to finish if the initial state is being verified (`idle` or `checking`), avoiding false redirects when reloading the page or accessing via a direct URL.
2. **Dual Token Persistence**:
   - Store the session token in `localStorage` in addition to cookies (`credentials: "include"`) and send it in the `Authorization: Bearer <token>` header to guarantee full compatibility in iframes and sandboxed environments.
3. **Deny-by-Default (routes protected by default)**:
   - Client: `createRouter({ guard: requireAuth(auth, "/login"), publicRoutes: ["/login", ...] })`. Every new route is protected without writing anything; **only the public ones are declared** (exact, `"/docs/*"`, or RegExp).
   - Server: `loadRoutes(dir, { auth: requireAuth() })` protects every `*.route.ts` except those exporting `export const meta = { public: true };` (co-located next to the sub-app).
   - Manually protecting routes already covered by the default policy is prohibited; internal refinement (e.g., a sensitive endpoint inside a public file) does use a targeted `requireAuth()`.

---

## 5. Single VanJS Instance
- Two copies of `vanjs-core` = two state systems that don't talk to each other: reactivity breaks silently.
- Consumers **declare** it in their `package.json` (satisfies the peerDep and pins the version) but **never import it directly**: they take `van` from `vanuikit` (`import { van } from "vanuikit"`).
- The demo build verifies the esbuild metafile (`check-single-vanjs.js`) and **fails** if the bundle contains more than one copy.
- **Runtime detection** (`guardSingleVan`, called in `src/index.ts`): if a consumer's bundle brings two copies, the library calls it out in the console (`[vanuikit] TWO copies…`, in English: npm consumers) with the exact fix. When debugging apps that consume the kit, that notice is the first clue: rewrite the imports to `import { van } from "vanuikit"`.
- **State provenance** (also ships in `dist/index.js`): the library captures the prototype of its own `van.state()` and exports `isOwnState`/`isForeignState` to spot a `State` coming from another copy. `installVanDebug` reports a `foreign-state` diagnostic whenever such a foreign `State` flows into the UI (as a prop or child). Note: this is the only runtime detection that catches a consumer's *direct* `import van from "vanjs-core"` — the `guardSingleVan` registry only sees copies that pass through vanuikit.

---

### Debugging: `trace`, `expectReactive`, `installVanDebug` and `check:van`

- `trace(state, "name")` — logs every change of the State and returns it for chaining
  (development only: adds a permanent listener, don't call inside bindings).
- `await expectReactive({ render, act, contains })` — frozen-binding detector for
  suites: renders, mutates, waits for van's microtask and throws an Error with hints about the gotchas
  (null function-children, separate trees, `t()` inside bindings). Agnostic to the runner.
- `installVanDebug(van)` — dev-only instrumenter (vanuikit/src/debug-graph.ts) that builds
  the real **dependency tree** (derive → states) and detects at the moment of the violation
  the silent rules: `van.state()` inside `van.derive` (R1), derives that write states
  during their computation (R2, and cycles), derives without reads (R3) and reactive containers via
  `trackRender` (R4; suppress with `renderIntentional`). Enabled in the demo with localStorage
  `van-debug=1` or `?van-debug`; it doesn't enter the production bundle.
- `bun run check:van` (in vanuikit) — static scan in CI: fails (exit 1) if there is `van.state`/
  `van.derive` inside `van.derive` (lexical version of R1) and reports warnings about
  `t()`/`raw()`/`fmt.*()` inside functions passed as children (R4, review manually).
- Visual graph view: in the demo, `/debug` (public, only visible in debug mode) renders
  the dependency graph as SVG (derives → states, writes in dashed red) and the
  list of diagnostics with their source. The api is exposed on `window.__vanDebug`.
- Full documentation of the debug system (rules, usage, view, and scan):
  see `vanuikit/docs/DEBUG_REACTIVITY.md` (shipped inside the package).

## 6. Testing and Code Quality
- Every new component must have unit tests in `vanuikit/tests/` runnable with `bun test`.
- Keep the test suite 100% green before considering any task complete.
- **Language gates**: English is the canonical language. `bun run check:spell`
  (cspell, en-only dictionaries — Spanish lives only in the translation dicts),
  `bun run i18n:check` and `bun run i18n:scan -- --check` must all pass in CI.
- **Commit messages in English** (repo convention for the international audience).
