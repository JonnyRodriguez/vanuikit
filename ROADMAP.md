# Roadmap — VanUikit

Evolution plan for the library. The guiding principles live in [AGENTS.md](./AGENTS.md):
first-class embedded components, zero boilerplate, inline i18n with `t()`/`raw()`, accessibility,
the single-instance guarantee, and a 100% green test suite before closing any task.

---

## Current state (2026-11-10)

Production-ready npm package **`vanuikit@0.3.1`** (MIT, published with documentation).

**Catalog — 41 components** in `vanuikit/src/components/`:

- **Form controls**: `Button`/`PrimaryButton`/`SecondaryButton`, `Field` family
  (`TextField`/`EmailField`/`PasswordField`/`TextareaField`), `Checkbox`, `Switch`,
  `RadioGroup`, `Form`, `Wizard`, `Combobox` (incl. `multiple` with chips), `DatePicker`.
- **Overlay & feedback**: `Modal`/`ModalBase`, `SpinModal`, `Spin`, `ConfirmDialog`/
  `confirmDialog`, `toast`, `Alert`, `Progress`, `Skeleton`, `EmptyState`, `Tooltip`,
  `Popover`, `Drawer`, `SelectDropdown`/`DropdownMenu`, `Kbd`.
- **Layout & navigation**: `AppShell`, `Sidebar`(+`Item`/`Group`), `HeaderBar`, `Nav`/
  `Link`, `Breadcrumbs`, `Tabs`, `Accordion`, `Card`/`CardTitle`.
- **Data**: `Table`/`DataGrid`, `Pagination`, `Tree`.
- **Session & preferences**: `UserBadge`, `ThemeToggle`, `LocaleSelector`, `Avatar`,
  `Badge`, `Icon`, `Svg`/`SvgPath`.

**Foundation** (`src/` root): single-instance provenance (`guardSingleVan`,
`isOwnState`/`isForeignState`), reactive i18n (`t()`/`raw()`) + `fmt` (locale-aware
dates/numbers/currency), light/dark/system theme, **deny-by-default** `Router` +
`loadRoutes` (server), `createAuth`, `createQuery`/`createMutation`, validators,
debug layer (`trace`, `expectReactive`, `installVanDebug`). Prebuilt screens:
`LoginForm`, `RegisterForm`. Server helpers under `vanuikit/server` (Hono).

**Quality & product**: 263 tests green (`bun test`), typecheck, `check:van`,
Tailwind-aligned palette (primary **blue**), full API reference + AI onboarding guide
shipped inside the npm package (`docs/`), `CHANGELOG.md`, English canonical language.

---

## Completed milestones

### Phases 1–5 (2026-10-15) — the catalog
- **Phase 1 — Binary form controls**: Checkbox, Switch, Radio/RadioGroup, Textarea
  (full `Field` contract, `Form` integration).
- **Phase 2 — Static feedback & loading**: Alert, Progress, Skeleton, EmptyState.
- **Phase 3 — Fine overlay**: Tooltip (CSS-positioned), Popover (click-outside/Esc),
  Drawer on 4 sides (backdrop + focus trap + scroll lock). Zero external deps.
- **Phase 4 — Scale & polish**: Combobox (WAI-ARIA), Accordion, Avatar, Breadcrumbs,
  Card/CardTitle.
- **Phase 5 — `fmt`**: `fmt.date/datetime/time/number/currency/percent/relative` over
  `Intl.*`, reactive to `currentLocale`; `fmt.raw.*` for imperative use.

### Cycle 2 (2026-10-15) — debug + missing pieces
- `debug.ts` (`trace`, `expectReactive`), `Kbd`, standalone `Pagination` (+`pageSlots`),
  `Combobox` `multiple`.

### Professionalization (2026-11-02/03)
- **English canonical language** — source, JSDoc, tests, docs and inline i18n defaults in
  English; `es`/`fr` as hand-maintained translations; `en.json` generated.
- **Single-instance detection** — `guardSingleVan` runtime warning + `isForeignState`
  provenance (catches a direct `import van from "vanjs-core"`).
- **Tailwind-aligned palette** — primary `green → blue` (`--vui-primary`: blue-600 light /
  blue-500 dark) + state tokens (`--vui-info/-success/-warning/-destructive` and `-fg`).
- **Docs shipped in the npm package** — `docs/`: API reference by family (6 files),
  `recipes.md`, `theming.md`, `server.md`, `AI-GUIDE.md` (consumer/AI onboarding),
  `README.md` index, plus `CHANGELOG.md`.
- **Tooling & docs hardening** — `Await` component (declarative Promise rendering),
  size budget (`bun run size`, 45 kB gzip), anti-FOUC snippet in `theming.md`.

---

## Next candidates (no date — embedded when a real need appears)

Keeping the philosophy: embed what repeats, not what *could* repeat.

**Infrastructure / release** (before wider adoption):
- **CI + release pipeline** — GitHub Actions running `bun test` + typecheck +
  `check:van` + build on PRs; `npm publish` on `v*` tags.
- **Size budget** — `@size-limit` against `dist/index.js` to prevent regressions.
- **Dark-mode FOUC snippet** — documented inline script to avoid the light→dark flash.
- **a11y axe harness** — run axe-core per component in the test suite to back the
  accessibility claim.

**Components** (from the annotated backlog):
- **`chooseDialog`** (M) — modal picker resolving `Promise<value | null>`; complements
  `confirmDialog`.

**Docs DX** (distant):
- Hosted docs site with per-component props tables and live previews
  (CodeSandbox-style).

---

## Explicitly out (for now)

- **FileUpload** — drag-drop + a11y + progress: separate project.
- **CommandPalette** — niche until a real page asks for it.

*Updated:* `DatePicker` was previously deferred; it is now part of the catalog. `Tree`
  was also built and is part of the catalog, so it no longer belongs here.

---

## Definition of Done (per component)

1. Implementation in `vanuikit/src/components/<name>.ts` with a reactive API (accepts
   `State` in visual props, same contract as the rest of the catalog).
2. i18n: all visible text with `t()`/`raw()`, no hardcoded strings; locales collected
   with `i18n:collect`.
3. Unit tests in `vanuikit/tests/` runnable with `bun test`.
4. Demo showcase in `demo/pages` (real usage, not a screenshot).
5. Styles via tokens from `uno.js` (no hardcoded colors; same tokens in vanuikit and demo).
6. `bun test` suite 100% green.
7. Exported from `vanuikit` (index.ts) and documented in the AGENTS.md catalog.
