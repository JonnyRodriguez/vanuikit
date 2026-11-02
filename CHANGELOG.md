# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/);
versionado SemVer.

## [0.2.0] — 2026-11-02

### Changed — paleta alineada a Tailwind CSS

- `--vui-primary`/`--vui-accent`: verde → familia azul (blue-600 light /
  blue-500 dark), la referencia de shadcn y los kits modernos. Jerarquía
  hover/active estándar (600→700→800 / 500→600→700).
- `--vui-border` light: gray-300 → gray-200; `--vui-background` dark:
  gray-800 → gray-900; `--vui-secondary` light: gray-300 → gray-200.
- `Button`: ancho auto por defecto; `block: true` activa `w-full` (antes
  `w-full` fijo, poco estándar para CTAs de fila).

### Added — tokens de estado

- `--vui-info(-fg)`, `--vui-success(-fg)`, `--vui-warning(-fg)` y
  `--vui-destructive-fg` + `--vui-accent-fg`: base (fondos sólidos, dots,
  tintes al 10%) y variante `-fg` legible como texto sobre tinte en ambos
  modos (700 en light / 300 en dark, ≥ 4.5:1).
- `Badge`, `Alert` y `toast` migrados a tokens semánticos (antes usaban
  clases de paleta cruda `emerald/amber/rose/slate`, ilegibles en modo claro
  y ajenos al re-theming). `Badge` danger ahora coincide con el botón
  destructivo (red, no rose); `toast` adopta el patrón estándar (superficie
  neutra + ícono del color del estado, estilo sonner/shadcn).
- `prefers-reduced-motion: reduce` en el reset: animaciones y transiciones
  se desactivan para quien las pide.

### Fixed

- `toast`: el contenedor se re-adjunta al `<body>` si algo lo reemplazó
  (suites con happy-dom, HMR) en vez de perderse para siempre.
- Demo: el build copia `vanuikit.css` del paquete (ya lo hacía el `uno.js` vía
  `vanuikit/styles.css`); el artefacto viejo en `demo/dist/` seguía sirviendo
  la paleta anterior hasta re-construir.

### Misc

- Metadata del paquete: `license`, `repository`, `keywords` (npm).

## [0.1.0] — 2026-10-15

- Primer release del app kit: 40 componentes accesibles (botones, campos con
  validación, formularios, controles binarios, combobox, datepicker, wizard,
  tablas, tabs, overlay fino, feedback, AppShell/Sidebar), router SPA con
  guards deny-by-default, `createAuth`, `createQuery`/`createMutation`,
  tema claro/oscuro/sistema, i18n reactivo (`t()`/`raw()`) y `fmt`
  locale-aware, instrumentación de reactividad (`trace`, `expectReactive`,
  `installVanDebug`).
