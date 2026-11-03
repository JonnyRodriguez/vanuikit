# Roadmap — VanUikit

Evolution plan for the library. The guiding principles live in [AGENTS.md](./AGENTS.md):
first-class embedded components, zero boilerplate, inline i18n with `t()`/`raw()`, accessibility,
and a 100% green test suite before closing any task.

---

## Current state (2026-10-15)

**17 components** in `vanuikit/src/components/`: Button (variants), Badge, Field family
(TextField/EmailField/PasswordField), Form, Modal/ModalBase/SpinModal, ConfirmDialog,
SelectDropdown/DropdownMenu, DataGrid/Table, Tabs, toast, Spin, layout (AppShell/HeaderBar/
Sidebar/SidebarGroup/SidebarItem), Nav/Link, ThemeToggle, LocaleSelector, UserBadge.

**Infrastructure**: inline i18n (`t(key, default, params?)` + `raw()`) with tooling
(`i18n:collect`/`i18n:check`/`i18n:scan`/`i18n:fix`), router with deny-by-default guard,
`createAuth`, light/dark/system theme, validators, authenticated fetch, `loadRoutes`
(server).

---

## Phase 1 — Binary form controls ✅ *completed (2026-10-15)*

The most noticeable gap: there are Fields for text, but no binary control, and real forms
need both. The new controls integrate into the `Form`/validators ecosystem.

- ✅ `Checkbox` — checked/indeterminate, label with reactive support, description, disabled.
- ✅ `Switch` — same contract as Checkbox (`role="switch"`), for settings pages.
- ✅ `Radio` + `RadioGroup` — mutually exclusive group with roving tabindex (arrows/Home/End),
  `role="radiogroup"`, declarative options.
- ✅ `Textarea` — multiline variant of Field, same validation and same API.
- ✅ Registered in `Form` as first-class fields (full `Field` contract via `checkable.ts`).

**Closing criteria**: 13 new tests (suite: 105 green), demo showcase, locales
collected (es/en/fr).

## Phase 2 — Static feedback and loading states ✅ *completed (2026-10-15)*

`toast` and `Spin` cover the transient/indeterminate; the persistent and the determinate are missing.

- ✅ `Alert` / `Callout` — static notices (info/success/warning/error), icon, dismissible.
- ✅ `Progress` — determinate/indeterminate bar with label and percentage.
- ✅ `Skeleton` — text, block and avatar placeholders with shimmer.
- ✅ `EmptyState` — icon + title + description + primary action.

**Closing criteria**: 12 new tests (suite: 117 green), demo showcase "Estados y
Feedback", locales collected (es/en/fr).

## Phase 3 — Fine overlay ✅ *completed (2026-10-15)*

Today it is solved with native `title` or ad-hoc absolute divs: one of the things that generates
the most loose boilerplate.

- ✅ `Tooltip` — positions with pure CSS, delay, visible on focus (keyboard), disabled on
  touch (`hover: none`).
- ✅ `Popover` — generic floating panel: click toggles, click-outside and Esc close (with
  focus return), content as `content(close)` factory rebuilt per open.
- ✅ `Drawer` / `Sheet` — sliding panels on 4 sides, backdrop, focus trap (Tab cannot
  escape), scroll lock (generalizes the sidebar responsive pattern).

**Closing criteria**: 14 new tests (suite: 131 green), demo showcase "Overlay fino",
lint and integration build green. No external dependencies: positioning with CSS
(document limitation: an ancestor with `overflow: hidden` may clip the panel).

## Phase 4 — Scale and polish ✅ *completed (2026-10-15)*

- ✅ `Combobox` — full WAI-ARIA pattern (input that filters while typing, ↑/↓/Home/End/Enter/Esc
  from the input itself, `aria-activedescendant`), bidirectional binding and `Field`
  contract for `Form` (real value via hidden input). Coexists with SelectDropdown (button select).
- ✅ `Accordion` — single/multiple, `defaultOpen`, content as factory (fresh bindings),
  `aria-expanded`/`region`.
- ✅ `Avatar` — 4 sizes, initials shared with UserBadge (refactor), `src` with automatic
  fallback to initials.
- ✅ `Breadcrumbs` — SPA anchors via the Router global click handler, `aria-current="page"`.
- ✅ `Card` + `CardTitle` — base surface without imposed padding (the consumer decides).

**Pending from Phase 4**: standalone `Pagination` and `Kbd` (evaluated with the next real
need in the demo).

**Closing criteria**: 17 new tests (suite: 148 green), demo showcase "Escala y pulido",
locales collected (es/en/fr).

## Phase 5 — `fmt`: the other half of i18n ✅ *completed (2026-10-15)*

- ✅ `fmt.date/datetime/time/number/currency/percent/relative` over `Intl.*`, with the same
  spirit as `t()`: reactive to `currentLocale` changes (children/props, create once outside
  of bindings) and `fmt.raw.*` for imperative consumption like `raw()`.
- ✅ `createFmt(i18n)` for isolated instances + global `fmt` singleton tied to `i18n`.
- Values accept `Date | number | ISO string`; invalid dates → `""` without exceptions.

**Closing criteria**: 12 new tests (suite: 160 green), demo card with live
re-formatting when switching language.

---

## 🎉 Original roadmap completed

All 5 phases were delivered the same day (2026-10-15), with the suite always green:
**21 components + fmt**, zero runtime dependencies beyond `vanjs-core` (Cycle 2 adds Pagination, Kbd, Combobox multiple and the debug layer).

**Candidates for a next cycle** (no date, embedded when the demo asks for them):
standalone `Pagination` and `Kbd` (deferred from Phase 4), `Combobox` multi-selection,
debug layer (`trace`/`expectReactive`), and re-evaluating `DatePicker` if a page
appears that truly needs it.

---

## Cycle 2 ✅ *completed (2026-10-15)*

The next-cycle candidates, minus `DatePicker` (still no page that asks for it):

- ✅ `debug.ts` — `trace(state)` (chainable change logging) and `expectReactive({ render, act,
  contains })` (detector of frozen/detached bindings for test suites, runner-agnostic;
  throws Error with hints about the gotchas).
- ✅ `Kbd` — semantic styled key (`<kbd>`).
- ✅ standalone `Pagination` — numbered with ellipsis (`pageSlots` exported), `page`
  bidirectional, `totalPages` reactive; coexists with DataGrid's simple pagination.
- ✅ `Combobox` `multiple` — removable chips (click on × and Backspace with empty input), the
  panel doesn't close when selecting, toggle when re-selecting; `value: State<string[]>`. Documented
  limitation: `FormData` collapses duplicates (read `field.value.val`).

---

## Annotated backlog — ecosystem findings (2026-10-27)

From the review of vanjs.org and the official ecosystem (decision: **annotated, no date** — they
get embedded when a real page asks for them, same philosophy as always):

- **Name — decision: keep `vanuikit`.** Verified on npm (2026-10-27): `vanuikit` is
  FREE (the official VanUikit is published as `vanjs-ui`, vanjs.org/vanuikit). `vanuikitx` rejected:
  the "X" brand belongs to VanX (official) — it would imply a double affiliation that doesn't exist.
  Positioning vs `vanjs-ui`: it's ~10 widgets without documented ARIA or focus management;
  ours is an app kit (accessible components + i18n/fmt + deny-by-default router + auth + debug).
  The accessibility gap is the flagship.
- **`Await`** (idea from `vanjs-ui`) — declarative rendering from any `Promise` (not only
  fetch) with `Pending`/`Error`/success slots. Sugar over a pattern that already exists
  (`createQuery` covers fetch; `Await` covers loose promises). Estimated effort: S.
- **`chooseDialog`** (idea from `choose` in `vanjs-ui`) — modal picker that resolves
  `Promise<value | null>`, on `Modal` + `Combobox` (with keyboard and focus trap: more
  accessible than theirs). Complements `confirmDialog`. Estimated effort: M.
- **Docs DX** (distant) — when vanuikit has a site/docs: live preview per component
  (CodeSandbox/jsfiddle), props table with defaults, per-component format like vanjs.org.
- **Not adopting**: `vanjs-ui`'s bags of `styleOverrides` (our UnoCSS token model +
  `class` props already cover it), `FloatingWindow` (niche, mouse-only).

---

## Explicitly out (for now)

- **DatePicker/Calendar** — huge scope (locale rules, keyboard); deserves its own stage.
- **FileUpload** — drag-drop + a11y + progress: separate project.
- **TreeView, CommandPalette** — niche until a real page asks for them.

The embedded philosophy works both ways: what is already repeated in the demo gets embedded,
not what *could* be repeated.

---

## Definition of Done (per component)

1. Implementation in `vanuikit/src/components/<name>.ts` with a reactive API (accepts `State` in
   visual props, same contract as the rest of the catalog).
2. i18n: all visible text with `t()`/`raw()`, no hardcoded strings; locales collected with
   `i18n:collect`.
3. Unit tests in `vanuikit/tests/` runnable with `bun test`.
4. Demo showcase in `demo/pages` (real usage, not a screenshot).
5. Styles via tokens from both `uno.js` (no hardcoded colors; same tokens in vanuikit and
   demo).
6. `bun test` suite 100% green.
7. Exported from `vanuikit` (index.ts) and documented in the AGENTS.md catalog.
