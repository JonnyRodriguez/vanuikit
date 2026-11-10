# Overlays & feedback

This page documents the overlay and feedback surface of **VanUikit**: modals, dialogues, toasts, alerts, progress indicators, skeletons, empty states, and floating overlays (tooltip, popover, drawer, dropdowns). All symbols are re-exported from the `vanuikit` package and follow the kit's reactivity contract: visual props accept `van.State` values, and `van` is always imported from `"vanuikit"` (never from `vanjs-core`). `toast` and `confirmDialog` are imperative APIs — use `raw()` rather than `t()` inside them.

---

## `Modal`

Convenience dialog built on `ModalBase`. It already ships a header with a title and close button, plus a footer with a default "Close" button. `Modal` is a factory: it returns an imperative handle (`open`, `close`, `set`, `setTitle`, `mount`, …) rather than a plain DOM node.

```ts
const modal = Modal();
modal.mount();
modal.set({ title: "Hello", body: "World" }, true); // opens
modal.close();
```

### Options (factory arguments)

| Name | Type | Default | Description |
|---|---|---|---|
| `initialContent` | `ModalProps \| null` | `null` | Optional initial content: `title`, `header`, `body`, `footer`. |
| `initialVisible` | `boolean` | `false` | Whether the modal starts open. |

`ModalProps = ModalContent & { title?: string | State<string> }`, where each of `header` / `body` / `footer` accepts a `ValidChildDomValue` or a `ModalZone` (a function returning a `ValidChildDomValue`, re-evaluated on each render).

### Returned handle

| Name | Type | Description |
|---|---|---|
| `open()` | `() => void` | Sets `isVisible` to `true`. |
| `close()` | `() => void` | Sets `isVisible` to `false`. |
| `set(input, show?)` | `(input: ModalProps, show?: boolean) => void` | Fills zones by part; completes the default footer if none is given and calls `setTitle` when `title` is present. Opens when `show` is `true`. |
| `setTitle(title)` | `(title: string \| State<string>) => void` | Updates the header title reactively. |
| `setHeader(value)` / `setBody(value)` / `setFooter(value)` | `(v: ModalZone \| ValidChildDomValue) => void` | Replaces a single zone. |
| `mount(container?)` | `(container?: HTMLElement) => void` | Appends the rendered dialog to `container` (default `document.body`). |
| `isVisible` | `State<boolean>` | Live visibility state. |
| `render` / `dom` | `() => HTMLElement` | Renders the dialog root element. |

### Usage

```ts
import { Modal } from "vanuikit";

const modal = Modal();
modal.mount();
modal.set({ title: "Confirm", body: "Proceed?" }, true);
```

### Notes

- The footer can be overridden by passing `footer` to `set()`; pass `footer: null` to remove it (e.g. in a loading modal).
- The default title and close button are rendered as a `ModalHeaderWithTitleAndClose`; the default close button uses the i18n key `modal.close`. Use `t()` for any custom text you pass.
- Clicking the backdrop closes the modal (the inner card stops propagation); the dialog carries `role="dialog"` and `aria-modal="true"`.

---

## `ModalBase`

The lowest-level building block: an overlay plus three zones (`header`, `body`, `footer`) filled via `set()` or the individual setters. No default title, close button, or footer are provided — you supply content per zone.

```ts
const base = ModalBase();
base.mount();
base.set({ body: "Hello world" }, true);
```

### Options (factory arguments)

| Name | Type | Default | Description |
|---|---|---|---|
| `initialContent` | `ModalContent \| null` | `null` | Optional initial zone content. |
| `initialVisible` | `boolean` | `false` | Whether the modal starts open. |

`ModalContent` is an object with optional `header`, `body`, and `footer` zones; each zone accepts a `ValidChildDomValue` or a `ModalZone` (function returning a `ValidChildDomValue`, `null`/`undefined` hides the zone).

### Returned handle

| Name | Type | Description |
|---|---|---|
| `open()` | `() => void` | Sets `isVisible` to `true`. |
| `close()` | `() => void` | Sets `isVisible` to `false`. |
| `set(input, show?)` | `(input: ModalContent, show?: boolean) => void` | Sets the zones present in `input`; opens when `show` is `true`. |
| `setHeader(value)` / `setBody(value)` / `setFooter(value)` | `(v: ModalZone \| ValidChildDomValue) => void` | Replaces a single zone. |
| `mount(container?)` | `(container?: HTMLElement) => void` | Appends the rendered dialog to `container` (default `document.body`). |
| `isVisible` | `State<boolean>` | Live visibility state. |
| `render` / `dom` | `() => HTMLElement` | Renders the dialog root element. |

### Usage

```ts
import { ModalBase } from "vanuikit";

const base = ModalBase(null, false);
base.mount();
base.setBody(span("Loading…"));
base.open();
```

### Notes

- Zone content passed as a function is re-evaluated on each render, which is the right shape for reactive content.
- The overlay uses `role="dialog"` and `aria-modal="true"`; clicking the backdrop calls `close()`.

---

## `SpinModal`

Helper that produces `ModalContent` for a modal with a spinner body and no footer — useful as the body of a loading/blocking modal. It is *not* a self-contained component; pass its result to a `Modal`/`ModalBase` (typically via `set()` or `initialContent`).

```ts
const modal = Modal();
modal.set(SpinModal("Processing…"), true); // open a spinner modal
```

### Signature

`SpinModal(msg: string): ModalContent`

| Name | Type | Default | Description |
|---|---|---|---|
| `msg` | `string` | — | Message shown under the spinner. |

Returns `{ body: () => Spin(msg), footer: null }` — the default "Close" footer is suppressed.

### Usage

```ts
import { Modal, SpinModal } from "vanuikit";

const modal = Modal();
modal.mount();
modal.set(SpinModal("Uploading…"), true);
```

### Notes

- Because the footer is `null`, the dialog has no close/cancel affordance; the caller must close it programmatically (`modal.close()`).
- The body renders a `Spin` (see below) with the given message.

---

## `Spin`

Animated loading indicator: a spinning border arc plus an optional message. Returns a DOM node.

```ts
span(Spin("Loading account…"));
```

### Props

| Name | Type | Default | Description |
|---|---|---|---|
| `msg` | `string \| State<string>` | `""` | Message shown under the spinner; omitted when empty. |

### Usage

```ts
import { Spin } from "vanuikit";

div(Spin(), Spin("Syncing…"));
```

### Notes

- Accepts a `State<string>` for the message, so the label can react to locale or content changes.
- Purely presentational; pair with `Modal`/`SpinModal` or any container that needs an inline loading state.

---

## `ConfirmDialog`

A pre-assembled confirmation dialog built on `Modal` (title, message, confirm/cancel buttons). Returns the same imperative `Modal` handle, so you must `mount()` it yourself. The confirm button is `PrimaryButton` (or destructive styling when `variant === "danger"`); the cancel button is `SecondaryButton`.

```ts
const dialog = ConfirmDialog({ title: "Delete?", message: "This cannot be undone." });
dialog.mount();
dialog.open();
```

### Props

| Name | Type | Default | Description |
|---|---|---|---|
| `title` | `string \| State<string>` | `t("dialog.confirmTitle", "Confirm action")` | Dialog header title. |
| `message` | `string \| ValidChildDomValue \| (() => ValidChildDomValue)` | — (required) | Body content. A function is re-evaluated per render. |
| `confirmText` | `string \| State<string>` | `t("dialog.confirm", "Confirm")` | Confirm button label. |
| `cancelText` | `string \| State<string>` | `t("dialog.cancel", "Cancel")` | Cancel button label. |
| `variant` | `"primary" \| "danger" \| "warning"` | `"primary"` | Visual tone; `danger` uses the destructive button styling. |
| `icon` | `ValidChildDomValue` | variant-based `Icon` | Custom leading icon. Default: `question` (primary), `alert-triangle` (danger), `bell` (warning). |
| `onConfirm` | `() => void` | — | Called after the dialog closes on confirm. |
| `onCancel` | `() => void` | — | Called after the dialog closes on cancel. |

### Usage

```ts
import { ConfirmDialog } from "vanuikit";

const dialog = ConfirmDialog({
  title: "Discard changes?",
  message: "Your edits will be lost.",
  variant: "warning",
  onConfirm: () => saveAndClose(),
});
dialog.mount();
dialog.open();
```

### Notes

- This is the declarative building block; for a one-shot promise-based flow use `confirmDialog`.
- `onConfirm`/`onCancel` fire *after* the dialog is closed. The modal handle returned also exposes `close()`, `set()`, `setTitle()`, etc.
- Canonical labels come from `t()`, so they follow the active locale.

---

## `confirmDialog`

Imperative confirmation helper that mounts, opens, and resolves a `Promise<boolean>`. Resolves `true` when confirmed, `false` on cancel. Because it is imperative (a handler), use `raw()` — not `t()` — for any text you pass to it.

```ts
if (await confirmDialog({ message: raw("confirm.delete", "Delete this item?") })) {
  await deleteItem();
}
```

### Signature

`confirmDialog(options: ConfirmDialogProps): Promise<boolean>`

| Name | Type | Default | Description |
|---|---|---|---|
| `options` | `ConfirmDialogProps` | — | Same props as `ConfirmDialog` (title, message, confirmText, cancelText, variant, icon, onConfirm, onCancel). |

Resolves `true` on confirm, `false` on cancel. `onConfirm`/`onCancel` callbacks, when provided, are invoked before the promise resolves.

### Usage

```ts
import { confirmDialog } from "vanuikit";

const ok = await confirmDialog({
  message: raw("modal.confirmPublish", "Publish this post?"),
  variant: "primary",
});
if (ok) publish();
```

### Notes

- **Imperative:** use `raw()` (not `t()`) for strings inside `options` — `t()` returns a reactive `State`, which is not suited to this one-shot flow.
- The dialog is mounted to `document.body` and opened automatically; it resolves and remains in the DOM (close it or let it be replaced) — the promise is the primary contract.
- `await confirmDialog(...)` is the canonical pattern for "are you sure?" guards.

---

## `toast`

A singleton snackbar-style notification manager. It owns a fixed container appended to `document.body` and exposes imperative methods per type. All text is provided by the caller.

```ts
toast.success(raw("settings.saved", "Changes saved"));
toast.error(raw("settings.err", "Something went wrong"), { durationMs: 6000 });
```

### Methods

| Name | Type | Description |
|---|---|---|
| `info(message, options?)` | `(message: string, options?: ToastOptions) => string` | Show an info toast; returns its id. |
| `success(message, options?)` | `(message: string, options?: ToastOptions) => string` | Show a success toast; returns its id. |
| `warning(message, options?)` | `(message: string, options?: ToastOptions) => string` | Show a warning toast; returns its id. |
| `error(message, options?)` | `(message: string, options?: ToastOptions) => string` | Show an error toast; returns its id. |
| `show(type, message, options?)` | `(type: ToastType, message: string, options?: ToastOptions) => string` | Low-level show by `ToastType` (`"info" | "success" | "warning" | "error"`); returns its id. |
| `remove(id)` | `(id: string) => void` | Dismiss a toast by id. |
| `clear()` | `() => void` | Dismiss all toasts. |

`ToastOptions = { title?: string; durationMs?: number }`. Default `durationMs` is `4000`; a value `<= 0` keeps the toast until removed manually.

### Usage

```ts
import { toast } from "vanuikit";

toast.success(raw("toast.saved", "Saved!"));
toast.warning(raw("toast.warn", "Please review"), { title: raw("toast.title", "Almost done") });
```

### Notes

- **Imperative only:** call it from handlers/async flows with `raw()` — never inside a container's render function, and never with `t()` (its reactive `State` is not appropriate here).
- Each toast is auto-dismissed after its `durationMs` and has a manual close button.
- The container (`#vanuikit-toast-container`) is created on first use and re-attached if it becomes detached (e.g. body replaced).

---

## `Alert`

A persistent, non-transient notice (unlike `toast`): form errors, status banners, inline confirmations. Renders with `role="alert"`. Accepts children as the message body.

```ts
Alert({ variant: "error", title: "Invalid email" }, "Please enter a valid address.");
```

### Props

| Name | Type | Default | Description |
|---|---|---|---|
| `variant` | `"info" \| "success" \| "warning" \| "error"` | `"info"` | Status tone; selects the box palette and default icon. |
| `title` | `ToggleText` (`string \| State<string>`) | — | Optional bold title above the body. |
| `showIcon` | `boolean` | `true` | When `false`, hides the leading icon. |
| `icon` | `ChildDom` | variant-based `Icon` | Custom leading icon. |
| `dismissible` | `boolean` | `false` | Shows a dismiss (×) button; on dismiss the alert stays hidden. |
| `onDismiss` | `() => void` | — | Called when a dismissible alert is closed. |
| `class` | `string` | — | Extra classes merged onto the root. |
| `children` | `ChildDom[]` | — | Body content rendered under the title. |
| `[key: string]` | `any` | — | Any extra attributes are forwarded to the root element. |

### Usage

```ts
import { Alert } from "vanuikit";

Alert(
  { variant: "warning", title: t("alert.session", "Session expiring"), dismissible: true },
  t("alert.sessionMsg", "You will be logged out soon."),
);
```

### Notes

- Text is supplied by the consumer via `t()` (reactive) or `raw()` in handlers; `dismissLabel` uses key `alert.dismiss`.
- When `dismissible`, dismissal sets an internal visibility state to hidden permanently for that alert instance.
- `class`/`[key: string]` are merged as extra attributes on the root element.

---

## `Progress`

Accessible, reactive progress bar (`role="progressbar"` + `aria-valuenow`). Determinate with `value` (accepts a `State` to update live), or indeterminate with `indeterminate`.

```ts
Progress({ value: 60, label: "Uploading" });
```

### Props

| Name | Type | Default | Description |
|---|---|---|---|
| `value` | `number \| State<number>` | `0` | Percentage 0–100 (clamped); accepts a state for a live bar. |
| `indeterminate` | `boolean \| State<boolean>` | `false` | Indeterminate mode (pulse animation); ignores `value`. |
| `label` | `ToggleText` | — | Optional label rendered above the bar, also used as `aria-label`. |
| `showValue` | `boolean` | `true` | Shows the percentage next to the label; hidden when indeterminate. |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Track thickness. |
| `fillClass` | `string` | `"bg-accent"` | Fill color class. |
| `class` | `string` | — | Extra classes on the root. |
| `[key: string]` | `any` | — | Forwarded to the root element. |

### Usage

```ts
import { Progress } from "vanuikit";

const pct = van.state(0);
div(
  Progress({ value: pct, label: t("upload.progress", "Uploading") }),
  interval(() => { pct.val = Math.min(100, pct.val + 10); }, 500),
);
```

### Notes

- `value` is clamped to 0–100 and rounded; the percentage reads live from the derived value.
- In indeterminate mode the inner bar shows a pulsing third-width bar and the numeric value is hidden.
- Zone `label` is a `ToggleText`, so it may be a reactive `State<string>`.

---

## `Skeleton`

Content placeholder shimmer used while loading: text lines (default), circle (avatar), or block (card). Decorative — renders with `aria-hidden="true"` so screen readers ignore it.

```ts
Skeleton({ variant: "text", lines: 3 });
```

### Props

| Name | Type | Default | Description |
|---|---|---|---|
| `variant` | `"text" \| "circle" \| "block"` | `"text"` | Shape of the placeholder. |
| `lines` | `number` | `3` | Number of text lines (last line is shorter); only for the `text` variant. |
| `class` | `string` | — | Extra classes on the root. |
| `[key: string]` | `any` | — | Forwarded to the root element. |

### Usage

```ts
import { Skeleton } from "vanuikit";

div(Skeleton({ variant: "block" }), Skeleton({ lines: 2 }));
```

### Notes

- `circle` renders a fixed `size-10` circle; `block` renders a full-width `h-24` rounded block.
- Text lines count is at least 1; when more than one line, the last is `w-2/3`.
- No props are reactive; use it as a static placeholder while data loads.

---

## `EmptyState`

Centered empty-state layout for a view or section: icon, title, description, and an optional primary action. Text is provided by the consumer via `t()`; the component only supplies layout.

```ts
EmptyState({
  title: t("users.empty", "No users yet"),
  description: t("users.emptyHint", "Add your first user to get started."),
  action: PrimaryButton({ onclick }, t("users.add", "Add user")),
});
```

### Props

| Name | Type | Default | Description |
|---|---|---|---|
| `icon` | `ChildDom` | `Icon({ name: "inbox" })` | Decorative icon. |
| `title` | `ToggleText` (`string \| State<string>`) | — (required) | Heading text. |
| `description` | `ToggleText` | — | Optional supporting text. |
| `action` | `ChildDom` | — | Action slot (e.g. a `Button` that opens a creation flow). |
| `class` | `string` | — | Extra classes on the root. |
| `[key: string]` | `any` | — | Forwarded to the root element. |

### Usage

```ts
import { EmptyState } from "vanuikit";

EmptyState({
  title: t("tasks.empty", "No tasks"),
  description: t("tasks.emptyHint", "Create one to get started."),
  action: PrimaryButton({ onclick: createTask }, t("tasks.new", "New task")),
});
```

### Notes

- Standard empty-state visual language is provided (dashed border, centered column) — pass your own text via `t()`.
- `description` and `action` are optional; when omitted they are not rendered.

---

## `Tooltip`

Accessible tooltip that appears on hover (with a delay) and on keyboard focus (instantly), and is disabled on coarse/touch pointers. Wraps a `trigger` element in a relative container and renders a CSS-positioned bubble.

```ts
Tooltip({ content: t("help.delete", "Delete permanently") }, Button({}, "Delete"));
```

### Props

| Name | Type | Default | Description |
|---|---|---|---|
| `content` | `ToggleText` | — (required) | Tooltip text. |
| `position` | `"top" \| "bottom" \| "left" \| "right"` | `"top"` | Bubble position relative to the trigger. |
| `delay` | `number` | `300` | Hover delay in ms before showing. Focus shows instantly. |
| `disabled` | `boolean \| State<boolean>` | `false` | When true, the tooltip never appears. |
| `class` | `string` | — | Extra classes on the bubble. |
| `[key: string]` | `any` | — | Forwarded to the wrapper element. |

### Usage

```ts
import { Tooltip } from "vanuikit";

Tooltip(
  { content: t("help.refresh", "Refresh data") },
  Button({ variant: "secondary" }, "↻"),
);
```

### Notes

- The trigger is decorated with `aria-describedby` pointing at the bubble (`role="tooltip"`).
- On coarse pointers (`(hover: none)`) the tooltip is disabled entirely.
- The bubble is always mounted (hidden via CSS) and positioned with CSS inside the flow, so an ancestor with `overflow: hidden` may clip it.

---

## `Popover`

Generic floating panel anchored to a trigger. Opens/closes on click, closes on Esc or click-outside, and returns focus to the trigger. Content is passed as a `content(close)` factory so it is rebuilt (and re-subscribed) on each open.

```ts
Popover({
  trigger: Button({}, "Menu"),
  content: (close) => div(button({ onclick: close }, "Close")),
});
```

### Props

| Name | Type | Default | Description |
|---|---|---|---|
| `trigger` | `ChildDom` | — (required) | The clickable trigger element. |
| `position` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Panel position relative to the trigger. |
| `ariaLabel` | `ToggleText` | — | Accessible label for the dialog panel. |
| `content` | `(close: () => void) => ValidChildDomValue` | — (required) | Content factory; receives `close()` so the panel can close itself. Re-evaluated each open. |
| `panelClass` | `string` | — | Extra classes on the panel (min width, padding, etc.). |
| `class` | `string` | — | Extra classes on the root wrapper. |
| `[key: string]` | `any` | — | Forwarded to the root element. |

### Usage

```ts
import { Popover } from "vanuikit";

Popover({
  trigger: Button({}, t("menu.show", "Options")),
  position: "bottom",
  content: (close) =>
    div(
      button({ onclick: () => { doThing(); close(); } }, t("menu.edit", "Edit")),
      button({ onclick: close }, t("menu.cancel", "Cancel")),
    ),
});
```

### Notes

- The trigger span carries `aria-haspopup="dialog"` and reactive `aria-expanded`.
- The panel is `role="dialog"` with `aria-modal="false"`; it stays mounted (hidden via CSS) so bindings are preserved, and the `content` factory rebuilds its content on each open.
- Esc triggers `close()` and returns focus to the trigger; click-outside closes the panel.
- Same CSS-positioning caveat as `Tooltip`: an ancestor with `overflow: hidden` may clip the panel.

---

## `Drawer`

Sliding panel on any side (generalizes the responsive sidebar pattern) with a backdrop, Esc-to-close, body scroll lock, focus moving into the panel (with a Tab trap) and back to the opener. The panel stays mounted (translated off-screen) to preserve bindings.

```ts
Drawer({ open, side: "right" }, div("Panel content"));
```

### Props

| Name | Type | Default | Description |
|---|---|---|---|
| `open` | `State<boolean>` | — (required) | Consumer-controlled state: `true` = open. |
| `side` | `"left" \| "right" \| "top" \| "bottom"` | `"right"` | Which side the panel slides from. |
| `dismissible` | `boolean` | `true` | Esc and backdrop click close the drawer. |
| `onClose` | `() => void` | — | Called when the drawer closes. |
| `showClose` | `boolean` | `true` | Shows a × button in the corner (uses `modal.close` key). |
| `modal` | `boolean` | `true` | `false` renders a non-blocking floating panel: no backdrop, no focus trap, no body scroll lock and `aria-modal="false"`, so the page behind stays operable (chat widgets, inspectors). |
| `class` | `string` | — | Extra panel classes (e.g. `w-96` to widen it). |
| `[key: string]` | `any` | — | Forwarded to the overlay element. |

### Usage

```ts
import { Drawer } from "vanuikit";

const open = van.state(false);
div(
  PrimaryButton({ onclick: () => (open.val = true) }, t("drawer.open", "Open")),
  Drawer({ open, side: "right", onClose: () => console.log("closed") },
    p(t("drawer.body", "Drawer content")),
  ),
);
```

### Notes

- `open` **must** be a `State<boolean>` you own — the drawer derives visibility, focus, scroll lock, and listeners from it.
- Body scroll is locked while open via `useScrollLock` (counter-based, safe with stacked overlays).
- Focus moves into the panel on open and returns to the previously focused element on close; Tab is trapped inside the panel while open.
- The panel is `role="dialog"`, `aria-modal="true"`, and carries `tabindex="-1"` for focusability.
- The backdrop is non-interactive when closed (`pointer-events-none`, `aria-hidden="true"`).

---

## `SelectDropdown`

Custom, accessible single-select (WAI-ARIA `combobox`/`listbox`). Supports search, keyboard navigation (↑/↓/Enter/Esc/Tab), disabled options, icons, and a bidirectional `value` (`State` or plain). Integrates with forms via `name`.

```ts
SelectDropdown({
  options: [{ value: "usd", label: "USD" }, { value: "eur", label: "EUR" }],
  value: currency,
  searchable: true,
  onChange: (v) => console.log(v),
});
```

### Props

| Name | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | auto-generated | Root element id (also derives `listbox` id). |
| `name` | `string` | — | Native form field name. |
| `options` | `SelectOption<T>[] \| State<SelectOption<T>[]>` | — (required) | Options; may be a state for a reactive list. |
| `value` | `State<T> \| T` | — | Controlled value; when a `State` is passed it is kept in sync bidirectionally. |
| `defaultValue` | `T` | first option | Initial/uncontrolled value when `value` is not a state. |
| `placeholder` | `string \| State<string>` | `t("dropdown.placeholder", "Select an option...")` | Shown when nothing is selected. |
| `searchable` | `boolean` | `false` | Shows a filtering input above the list. |
| `searchPlaceholder` | `string \| State<string>` | `t("dropdown.searchPlaceholder", "Search...")` | Placeholder for the search input. |
| `disabled` | `boolean \| State<boolean>` | `false` | Disables the control. |
| `class` | `string` | — | Extra classes on the root. |
| `onChange` | `(value: T, option: SelectOption<T>) => void` | — | Called when an option is selected. |

`SelectOption<T>`: `{ value: T; label: string | State<string>; description?: string | State<string>; icon?: ChildDom; disabled?: boolean }`.

### Usage

```ts
import { SelectDropdown } from "vanuikit";

const currency = van.state("usd");
SelectDropdown({
  options: [
    { value: "usd", label: "USD", description: "US Dollar" },
    { value: "eur", label: "EUR", icon: emoji("🇪🇺") },
  ],
  value: currency,
  searchable: true,
  onChange: (v) => onCurrencyChange(v),
});
```

### Notes

- When `value` is a `State<T>`, selecting an option writes back to it; otherwise the select manages internal state (seeded by `defaultValue` or the first option).
- Keyboard: ArrowDown/ArrowUp/Enter/Space open and navigate; Esc closes and returns focus to the button; Tab closes. The trigger has `role="combobox"`, `aria-haspopup="listbox"`, and reactive `aria-expanded`.
- When `searchable`, filtering matches option labels case-insensitively; an empty result shows `t("dropdown.empty", "No results found")`.
- Document-level click handler closes the menu when clicking outside.

---

## `DropdownMenu`

Contextual action menu. The trigger is a factory `(isOpen) => ChildDom` so it can reflect open state; items support regular actions, headers, dividers, badges, disabled and destructive states.

```ts
DropdownMenu({
  trigger: (isOpen) => Button({}, isOpen.val ? "Open" : "Closed"),
  items: [
    { label: "Edit", onClick: () => edit() },
    { type: "divider" },
    { label: "Delete", destructive: true, onClick: () => remove() },
  ],
});
```

### Props

| Name | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | auto-generated | Root element id. |
| `trigger` | `(isOpen: State<boolean>) => ChildDom` | — (required) | Factory receiving the open state; its result is the clickable trigger. |
| `items` | `DropdownMenuItem[]` | — (required) | Menu items (item / header / divider). |
| `align` | `"left" \| "right"` | `"left"` | Horizontal alignment of the menu panel. |
| `class` | `string` | — | Extra classes on the root. |

`DropdownMenuItem` is a union:

| Shape | Type | Description |
|---|---|---|
| `item` | `{ label: string \| State<string>; icon?: ChildDom; badge?: string \| number; disabled?: boolean; destructive?: boolean; onClick?: (e: MouseEvent) => void }` | Selectable action. |
| `header` | `{ type: "header"; label: string \| State<string> }` | Non-interactive section heading. |
| `divider` | `{ type: "divider" }` | Horizontal separator. |

### Usage

```ts
import { DropdownMenu } from "vanuikit";

DropdownMenu({
  align: "right",
  trigger: (isOpen) =>
    Button({ variant: "secondary" }, `Menu ${isOpen.val ? "▲" : "▼"}`),
  items: [
    { type: "header", label: "Actions" },
    { label: "Duplicate", icon: Icon({ name: "copy" }), onClick: () => duplicate() },
    { type: "divider" },
    { label: "Delete", destructive: true, onClick: () => remove() },
  ],
});
```

### Notes

- The menu is `role="menu"` with `aria-orientation="vertical"`; items are `role="menuitem"` buttons.
- Esc closes the menu; clicking outside closes it. `disabled` items are non-interactive (`opacity-40`, `cursor-not-allowed`).
- `destructive` items render in the destructive color; `badge` renders a small mono label on the right.
- Clicking an item invokes `onClick` (if any) then closes the menu.

---

## `Kbd`

Semantic styled key (`<kbd>`) for shortcuts, combos, and UI hints. Returns a DOM node.

```ts
p("Press ", Kbd({ size: "sm" }, "Ctrl"), " + ", Kbd({ size: "sm" }, "K"));
```

### Props

| Name | Type | Default | Description |
|---|---|---|---|
| `size` | `"sm" \| "md"` | `"md"` | Keycap size. |
| `class` | `string` | — | Extra classes on the `<kbd>`. |
| `[key: string]` | `any` | — | Forwarded to the `<kbd>` element. |
| `children` | `ChildDom[]` | — | Key label content. |

### Usage

```ts
import { Kbd } from "vanuikit";

div("Save: ", Kbd({}, "Ctrl"), " + ", Kbd({}, "S"));
```

### Notes

- Renders a `<kbd>` with mono font, border, and subtle background; `sm` uses smaller padding and `10px` text.
- Purely presentational; no reactivity or accessibility contract beyond the native `<kbd>` semantics.
