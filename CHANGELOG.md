# Changelog

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
SemVer versioning.

## [0.4.0] - 2026-11-20

### Added

- `Tree` component - hierarchical tree with recursive indentation, expand/collapse
  (starts expanded, manual collapse persists), `role="tree"`/`aria-expanded`, a
  per-node `actions` slot, and an inline add-child mode (`onAddChild`).
- `Modal`/`ModalBase`: size variants `sm`/`md`/`lg`/`xl`.
- `Drawer`: non-modal mode (`modal: false`).
- Demo: new `Dashboard` page consuming `/api/auth/me` (protected client route + protected
  server data).
- Public documentation portal (Starlight, generated from `vanuikit/docs/`) with
  integrated search, deployed on Cloudflare Pages, plus a static client-only
  component playground at `/playground/`.
- Open source project files: root `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`,
  `SECURITY.md`, and GitHub issue/PR templates.
- Release automation workflow for publishing tagged releases to npm.

### Changed

- Documentation and deployment pipeline updated to build and publish the
  standalone component playground alongside the docs site.

### Fixed

- `Sidebar`: the nav overflow scrollbar is hidden while keeping scroll functional; the
  panel is positioned under the `vui-app-shell` hook, immune to utilities regenerated
  by the consumer.
- `Icon`: respects the consumer's size over the default `size-4`.
- `SelectDropdown`: keeps the menu open when clicking the chevron arrow.

### CI

- Checks workflow: build the kit before running tests (dist needed to resolve
  `vanuikit`); bump `actions/checkout` to v5; fix the duplicated `working-directory`
  path; build docs and the component playground in CI.

## [0.3.1] - 2026-11-03

### Fixed

- `SelectDropdown` - clicking the chevron (▼/▲) arrow now toggles the menu
  reliably. The outside-click handler listened on `click`, but the chevron
  and label are function-children: when `isOpen` flips, van re-renders the
  trigger and detaches the original event-target node, so `el.contains(e.target)`
  returned `false` and the menu closed the instant it opened. Switched the
  outside-click detection to `pointerdown` (no state has changed yet, so the
  target is still attached and the containment check is reliable).

## [0.3.0] - 2026-11-03

### Added

- `Await` component — declarative rendering from any `Promise` with
  pending/error/success slots (complements `createQuery`).
- `bun run size` — size budget check (gzip limit) over `dist/index.js`.
- Docs: `theming.md` gains a "Prevent the light→dark flash (FOUC)" snippet.

## [0.2.0] — 2026-11-02

### Changed — English as the canonical language

- Library source (comments, JSDoc), test titles and the inline defaults of
  `t()`/`raw()` are now **English**; Spanish and French are hand-maintained
  translations (`es.json`/`fr.json`) and `en.json` is generated from the
  defaults. i18n keys are unchanged — existing dictionaries keep working.
- npm-facing docs (`README.md`, package description) translated to English.
- `guardSingleVan` console warning shipped in English from the start.

### Changed — Tailwind-aligned palette

- `--vui-primary`/`--vui-accent`: green → blue family (blue-600 light /
  blue-500 dark), the shadcn reference and modern kits. Standard hover/active
  hierarchy (600→700→800 / 500→600→700).
- `--vui-border` light: gray-300 → gray-200; `--vui-background` dark:
  gray-800 → gray-900; `--vui-secondary` light: gray-300 → gray-200.
- `Button`: auto width by default; `block: true` enables `w-full` (previously
  fixed `w-full`, non-standard for inline-row CTAs).

### Added — state tokens and single-instance guard

- Runtime detection of the single-instance rule (`guardSingleVan`): if the
  bundle carries two copies of `vanjs-core`, the library warns on the console
  with the symptoms and the exact solution — instead of breaking silently (via
  `Symbol.for`, visible to all copies of the module).

- `--vui-info(-fg)`, `--vui-success(-fg)`, `--vui-warning(-fg)` and
  `--vui-destructive-fg` + `--vui-accent-fg`: base (solid backgrounds, dots,
  10% tints) and a `-fg` variant legible as text on tint in both modes
  (700 in light / 300 in dark, ≥ 4.5:1).
- `Badge`, `Alert` and `toast` migrated to semantic tokens (previously used raw
  palette classes `emerald/amber/rose/slate`, unreadable in light mode and
  alien to re-theming). `Badge` danger now matches the destructive button
  (red, not rose); `toast` adopts the standard pattern (neutral surface +
  state-colored icon, sonner/shadcn style).
- `prefers-reduced-motion: reduce` in the reset: animations and transitions
  are disabled for those who request it.

### Fixed

- `toast`: the container is re-attached to `<body>` if something replaced it
  (happy-dom suites, HMR) instead of being lost forever.
- Demo: the build copies `vanuikit.css` from the package (as `uno.js` already
  did via `vanuikit/styles.css`); the old artifact in `demo/dist/` kept serving
  the previous palette until rebuild.

### Misc

- Package metadata: `license`, `repository`, `keywords` (npm).

## [0.1.0] — 2026-10-15

- First release of the app kit: 40 accessible components (buttons, validated
  fields, forms, binary controls, combobox, datepicker, wizard, tables, tabs,
  fine overlay, feedback, AppShell/Sidebar), SPA router with deny-by-default
  guards, `createAuth`, `createQuery`/`createMutation`, light/dark/system
  theme, reactive i18n (`t()`/`raw()`) and locale-aware `fmt`, reactivity
  instrumentation (`trace`, `expectReactive`, `installVanDebug`).
