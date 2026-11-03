# Theming & CSS

VanUikit ships **precompiled CSS** (`dist/vanuikit.css`) generated from the
`src/` classes with UnoCSS. No toolchain is required: link the stylesheet once
and override the semantic tokens to re-theme.

```html
<link rel="stylesheet" href="node_modules/vanuikit/dist/vanuikit.css" />
```

or in JS: `import "vanuikit/styles.css"`.

---

## Color modes

The library supports **light / dark / system**. The `.dark` class and
`data-theme="dark"` are applied to `<html>` (e.g. by
[`createTheme`](./api/session-theme-i18n.md)) — the light palette lives in
`:root`, the dark in `:root.dark`.

## Semantic tokens

Components never hardcode colors; they consume `--vui-*` variables:

| Token | Purpose |
|---|---|
| `--vui-primary` / `-hover` / `-active` / `-fg` / `-shadow` | Primary action color and foreground/state hierarchy |
| `--vui-secondary` / `-hover` / `-active` / `-fg` | Secondary surfaces |
| `--vui-accent` / `-hover` / `-fg` | Accent color |
| `--vui-focus` | Focus ring color |
| `--vui-background` | Page background |
| `--vui-foreground` / `-soft` | Text (strong / muted) |
| `--vui-muted` | Muted surfaces |
| `--vui-border` | Borders and dividers |
| `--vui-overlay` | Modal/drawer backdrop |
| `--vui-destructive` / `-fg` | Error / destructive actions |
| `--vui-info` / `-fg` | Informational status |
| `--vui-success` / `-fg` | Success status |
| `--vui-warning` / `-fg` | Warning status |
| `--vui-radius-md` / `lg` / `2xl` / `full` | Border radii |
| `--vui-shadow-sm` / `lg` / `xl` / `2xl` | Elevation shadows |

The status tokens come in a **base** (solid backgrounds, dots, 10% tints) and
a **`-fg`** variant that stays legible as text on the tint in both modes
(700 in light, 300 in dark, ≥ 4.5:1). `Badge`, `Alert` and `toast` consume
them — re-theming those tokens re-themes the components.

## Re-theming

Override the variables you need in your own CSS **loaded after** the package
stylesheet:

```css
:root {
  --vui-primary: #0ea5e9;      /* sky instead of the default blue */
  --vui-radius-md: 0.5rem;     /* larger radii */
  --vui-success: #16a34a;
}

:root.dark {
  --vui-primary: #38bdf8;
}
```

The built-in palette is aligned with Tailwind (the shadcn reference):
`primary`/`accent` = blue-600 in light / blue-500 in dark, neutrals = gray,
`destructive` = red.

## Accessibility

- Focus is visible via `--vui-focus` on all interactive elements.
- `prefers-reduced-motion: reduce` disables animations and transitions for
  users who request it (included in the reset).
