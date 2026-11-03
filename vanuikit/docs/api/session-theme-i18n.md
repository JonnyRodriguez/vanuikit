# Session, theme & i18n

The components and factories in this group cover the "preferences" half of VanUikit: visual theme (Light / Dark / System), locale selection, and the authenticated user's profile card. All of them are re-exported from the `vanuikit` package root and are fully reactive — they read and write VanJS `State` instances that update in place when the theme or locale changes.

Every API here relies on a single VanJS instance: `import { van } from "vanuikit"` (never import `vanjs-core` directly, or the consumer's state system will be disconnected from the library's).

---

## `ThemeToggle`

A self-contained control to switch the visual theme between Light, Dark, and System. It operates on a `ThemeInstance`, cycling through modes in the `"button"` variant, or rendering one button per mode in the `"segmented"` variant.

### Props / Options

| Name | Type | Default | Description |
|---|---|---|---|
| `theme` | `ThemeInstance` | `—` (defaults to an internal instance created via `createTheme()`) | The theme instance to control. |
| `i18n` | `I18nInstance` | `—` (defaults to the global `i18n` singleton) | Instance used for the component's own labels (`Light`, `Dark`, `System`, ARIA labels). |
| `variant` | `"button" \| "segmented"` | `"button"` | `"button"` renders a single cycling button; `"segmented"` renders a `radiogroup` with one button per mode. |
| `showLabel` | `boolean` | `false` | Show the mode name text next to the icon. |
| `includeSystem` | `boolean` | `true` | Include the `system` mode in the cycle (button) / in the group (segmented). |
| `class` | `string` | `—` | Extra CSS classes to append to the root element. |

### Usage

```ts
import { ThemeToggle, createTheme } from "vanuikit";

const theme = createTheme({ defaultMode: "system" });

// Single cycling button: Light → System → Dark → Light
ThemeToggle({ theme });

// Segmented radiogroup with explicit labels
ThemeToggle({ theme, variant: "segmented", showLabel: true });

// Two-state cycle (no "system" option)
ThemeToggle({ theme, includeSystem: false });
```

### Notes

- **`"button"` variant** cycles through `light → system → dark → light` when `includeSystem` is `true`; with `includeSystem: false` it toggles between `light` and `dark`.
- **`"segmented"` variant** renders a `role="radiogroup"` with `<button role="radio">` elements, one per mode; the active mode is reflected through a derive on `theme.mode`.
- The icon reflects the current mode (`sun` / `moon` / `monitor`); the component uses `i18n.t(...)` for its labels, so they update on locale change.
- If no `theme` is passed, an internal default `ThemeInstance` is created once and reused; if no `i18n` is passed, the global `i18n` singleton is used.

---

## `LocaleSelector`

A self-contained control to switch the current locale. It renders either a styled native dropdown (`"select"`) or a group of selection pills (`"buttons"`), with option labels auto-detected from the loaded dictionaries and multicolor SVG flags.

### Props / Options

| Name | Type | Default | Description |
|---|---|---|---|
| `i18n` | `I18nInstance` | `—` (defaults to the global `i18n` singleton) | The i18n instance whose `currentLocale` is controlled. |
| `options` | `LocaleOption[]` | `—` (auto-detected from `i18n.locales`) | Explicit list of locale options; when omitted, options are derived from the loaded dictionaries. |
| `variant` | `"select" \| "buttons"` | `"select"` | `"select"` renders a native `<select>`; `"buttons"` renders a `role="group"` of pills. |
| `class` | `string` | `—` | Extra CSS classes to append to the root element. |

`LocaleOption` is `{ code: string; label: string; flag?: string }` — `flag` is deprecated (the flag is now derived from the code with multicolor SVG).

### Usage

```ts
import { LocaleSelector } from "vanuikit";

LocaleSelector({ i18n });                       // styled native <select>
LocaleSelector({ i18n, variant: "buttons" });   // pills

// Explicit options
LocaleSelector({ i18n, options: [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
] });
```

### Notes

- **Auto-detection**: when `options` is omitted, the available locales are read from `i18n.locales`; each label uses the dictionary's `lang.<code>` entry (falling back to `es.lang.<code>`, then the uppercase code).
- **Flags**: rendered as inline multicolor SVG per code (`es`, `fr`, `de`, `it`, `pt`, `en`); unknown codes fall back to a globe icon.
- The active selection is driven by `i18n.currentLocale`; selecting an option calls `i18n.setLocale(code)`.

---

## `UserBadge`

A card showing the authenticated user's avatar (initials), name, status, and a sign-out button. It is a render function that reads the auth/user state reactively and re-renders when it changes.

### Props / Options

| Name | Type | Default | Description |
|---|---|---|---|
| `auth` | `AuthState` | `—` | Reactive VanUikit auth state. When provided, the user is read from `auth.user` and logout calls `auth.logout()`. |
| `user` | `State<AuthUser \| null> \| AuthUser \| null` | `—` | Direct user object or a `State` holding one. |
| `i18n` | `I18nInstance` | `—` (defaults to the global `i18n` singleton) | Instance used for the "Active session" / "Sign out" labels. |
| `onLogout` | `() => void \| Promise<void>` | `—` | Optional callback invoked after `auth.logout()` (when `auth` is provided) on logout click. |
| `statusText` | `string \| State<string>` | `—` (defaults to a reactive "Active session") | Subtitle or secondary status line. |
| `showLogout` | `boolean` | `true` | Show or hide the sign-out button. |
| `compact` | `boolean \| State<boolean>` | `false` | Compact mode for collapsed sidebars: centered avatar plus icon-only logout button (title holds the name). |
| `class` | `string` | `—` | Extra CSS classes for the container. |

### Usage

```ts
import { UserBadge } from "vanuikit";

UserBadge({ auth: authState });                          // full card with logout
UserBadge({ auth: authState, compact: collapsed });       // avatar on a collapsed rail
UserBadge({ user: myUserState, onLogout: () => api.signOut() });
```

### Notes

- `UserBadge` returns a **function-child** (a render function), so it reads `auth.user` / `user` reactively and re-renders when the user changes.
- When there is no user, it renders an empty hidden `<div>`.
- The display name falls back to the user's email when no `name` is set; initials come from `getInitials(name | email, "U")` and are rendered via `Avatar`.
- Clicking the logout button awaits `auth.logout()` (if `auth` is provided) and then `onLogout()`, in that order.

---

## `createTheme` / `ThemeMode` / `ThemeOptions` / `ThemeInstance`

Factory for a reactive theme manager that syncs the `.dark` class and the `data-theme` attribute on the `<html>` element and persists the preference to `localStorage`.

```ts
createTheme(options?: ThemeOptions): ThemeInstance
```

### `ThemeOptions`

| Name | Type | Default | Description |
|---|---|---|---|
| `storageKey` | `string` | `"vanuikit-theme"` | `localStorage` key used to persist the mode. |
| `defaultMode` | `ThemeMode` | `"system"` | Mode used when nothing is stored (or when `localStorage` is unavailable). |
| `attribute` | `string` | `—` | Declared on the interface but not currently consumed by the implementation. |

`ThemeMode` is `"light" | "dark" | "system"`.

### `ThemeInstance` members

| Member | Type | Description |
|---|---|---|
| `mode` | `State<ThemeMode>` | The current mode (`light` / `dark` / `system`). |
| `isDark` | `State<boolean>` | Reactive derivation: `true` when the effective theme is dark (follows the system preference when `mode === "system"`). |
| `setMode(mode)` | `(mode: ThemeMode) => void` | Sets the mode, persists it to `localStorage`, and applies the `dark` class / `data-theme` attribute. |
| `toggle()` | `() => void` | Toggles between `light` and `dark` based on the current *effective* dark state (system is resolved, not cycled). |

### Usage

```ts
import { createTheme } from "vanuikit";

const theme = createTheme({
  defaultMode: "system",      // "light" | "dark" | "system"
  storageKey: "my-app-theme",
});

span(theme.mode);             // reactive current mode
span(theme.isDark);           // "true" when effective theme is dark

// In a handler:
theme.setMode("dark");
theme.toggle();
```

### Notes

- The instance reads the stored mode from `localStorage` at creation, falls back to `defaultMode`, and applies the theme immediately.
- `applyTheme()` toggles the `.dark` class and sets `data-theme="dark" | "light"` on `document.documentElement`.
- It listens to the `prefers-color-scheme: dark` media query so `isDark` stays correct when `mode === "system"` and the OS preference changes.
- If `window`/`document` are undefined (SSR), the instance degrades gracefully (no persistence, no DOM writes).

---

## `createI18n` / `i18n` / `t` / `raw`

Factory for a reactive, ultra-light internationalization manager.

```ts
createI18n<T extends Record<string, any>>(options?: I18nOptions<T>): I18nInstance<T>
```

### `I18nOptions`

| Name | Type | Default | Description |
|---|---|---|---|
| `defaultLocale` | `string` | *(required)* | The locale used when nothing is stored / when a key is missing in the active locale. |
| `locales` | `Record<string, T>` | `—` (defaults to VanUikit's built-in `en`/`es` dictionaries) | Nested dictionary map, e.g. `{ en: { greeting: "Hello {name}" } }`. |
| `storageKey` | `string` | `"vanuikit-locale"` | `localStorage` key used to persist the active locale. |

### `I18nInstance` members

| Member | Type | Description |
|---|---|---|
| `currentLocale` | `State<string>` | The active locale code. |
| `locales` | `Record<string, Record<string, any>>` | The live (merged) dictionary data. |
| `setLocale(locale)` | `(locale: string) => void` | Sets the active locale (only if it exists in `locales`), persists it, and sets `document.documentElement.lang`. |
| `getLocale()` | `() => string` | Returns the current locale code. |
| `addTranslations(translations)` | `(translations: Record<string, Record<string, any>>) => void` | Deep-merges co-located translations into `locales` and bumps an internal revision so already-rendered texts re-resolve. |
| `t(key, defaultVal?, params?)` | `(key, defaultVal?, params?) => State<string>` | Returns a reactive derivation that resolves the translation and updates when the locale (or revision) changes. |
| `raw(key, defaultVal?, params?)` | `(key, defaultVal?, params?) => string` | Resolves the translation instantly as a plain string. |

### `t()` vs `raw()`

- **`t(key, default, params?)`** returns a reactive `State<string>`. Use it in DOM slots and component props — the text mutates when `currentLocale` changes. The parameters go at the end as `{name}` placeholders: `t("***REMOVED***.***REMOVED***With", "Top up with {name}", { name: ***REMOVED***.name })`.
- **`raw(key, default, params?)`** resolves instantly and is only for imperative contexts (handlers, toasts, `confirmDialog`). **Never** call `raw()` (or `t()` inside a function-child) inside a render function passed as a child — that read becomes a dependency of the container binding and rebuilds the whole subtree on every locale change.
- Keys are nested, e.g. `"field.email.label"`; when a key is missing in the active locale, it falls back to `defaultLocale`, then to `defaultVal`, then to the key itself. Missing `{placeholder}` tokens are left as-is.

### Usage

```ts
import { createI18n, t, raw, i18n } from "vanuikit";

const myI18n = createI18n({
  defaultLocale: "en",
  locales: {
    en: { greeting: "Hello {name}", buttons: { save: "Save" } },
    es: { greeting: "Hola {name}", buttons: { save: "Guardar" } },
  },
});

span(t("greeting", "Hello {name}", { name: "Ada" })); // reactive, updates on locale change
toast.info(raw("buttons.save", "Save"));               // imperative, resolves now

myI18n.setLocale("es");
span(myI18n.t("greeting", "Hello {name}", { name: "Ada" }));
```

### Global singleton and helpers

- `i18n` — the global `I18nInstance` created as `createI18n({ defaultLocale: "en", locales: defaultLocales })`.
- `t(key, defaultVal?, params?)` — direct helper over the `i18n` singleton, returns `State<string>`.
- `raw(key, defaultVal?, params?)` — direct helper over the `i18n` singleton, returns `string`.

---

## `createFmt` / `fmt`

Factory for locale-aware formatters — the counterpart of `t()`/`raw()` for dates, numbers, currency, percentages, and relative times.

```ts
createFmt(i18n?: I18nInstance = defaultI18n): Fmt
```

- `DateInput` = `Date | number | string`. Invalid dates yield `""` without throwing.
- `FmtCurrencyOptions` extends `Intl.NumberFormatOptions` with `currency?: string` (default `"USD"`).
- `RelativeUnit` = `Intl.RelativeTimeFormatUnit`.
- `Fmt` = `ReturnType<typeof createFmt>`.

### Reactive formatters (return `State<string>`)

| Member | Signature | Notes |
|---|---|---|
| `date` | `(value: DateInput, opts?: Intl.DateTimeFormatOptions) => State<string>` | `dateStyle: "medium"` by default. |
| `datetime` | `(value: DateInput, opts?: Intl.DateTimeFormatOptions) => State<string>` | Date plus `timeStyle: "short"`. |
| `time` | `(value: DateInput, opts?: Intl.DateTimeFormatOptions) => State<string>` | `timeStyle: "short"` by default. |
| `number` | `(value: number, opts?: Intl.NumberFormatOptions) => State<string>` | Locale-aware number formatting. |
| `currency` | `(value: number, opts?: FmtCurrencyOptions) => State<string>` | `style: "currency"`, default `"USD"`. |
| `percent` | `(value: number, opts?: Intl.NumberFormatOptions) => State<string>` | `style: "percent"`. |
| `relative` | `(value: number, unit: RelativeUnit, opts?: Intl.RelativeTimeFormatOptions) => State<string>` | `numeric: "auto"` by default. |

The reactive formatters are derivations over `i18n.currentLocale`: create them **once outside bindings** and insert the resulting `State<string>` into the DOM (same rule as `t()`).

### `raw.*` formatters (resolve instantly)

The same seven methods exist under `fmt.raw.*` (`fmt.raw.date`, `fmt.raw.datetime`, `fmt.raw.time`, `fmt.raw.number`, `fmt.raw.currency`, `fmt.raw.percent`, `fmt.raw.relative`) with identical signatures, but they return plain strings — use them in imperative contexts (handlers, toasts).

### Usage

```ts
import { fmt, createFmt } from "vanuikit";

span(fmt.date(order.createdAt));                    // State, reformats when the language changes
span(fmt.currency(item.price, { currency: "EUR" }));
span(fmt.relative(paidAt, "minute"));               // e.g. "3 minutes ago"

toast.info(`Total: ${fmt.raw.currency(total)}`);    // imperative use

const myFmt = createFmt(myI18n);                    // isolated instance tied to its own i18n
```

### Global singleton

`fmt` is the global formatter instance, created as `createFmt(defaultI18n)` — tied to the global `i18n` singleton.

---

## Single-instance constraint

All reactive behavior in this module depends on **one** VanJS instance. Always import `van` from `"vanuikit"` (and let consumers declare `vanjs-core` only as a peer dependency, never import it directly). Two copies of `vanjs-core` in the bundle produce two disconnected state systems that don't talk to each other; the library detects this at runtime and logs a `[vanuikit] TWO copies…` diagnostic with the fix.
