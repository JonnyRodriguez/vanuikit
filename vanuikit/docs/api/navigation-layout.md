# Navigation & layout

Components for app structure and navigation: the responsive `AppShell` shell alongside its `Sidebar`/`HeaderBar` pieces, declarative navigation (`Link`, `Nav`, `Breadcrumbs`) and interactive content containers (`Tabs`, `Accordion`, `Card`). All components are re-exported from the `vanuikit` package; `van` is imported from `"vanuikit"` (never from `vanjs-core`) to guarantee a single VanJS instance.

Reactivity contract: props that react (labels, active/current states, values) accept `van.State` in addition to plain values. Every component is built from real source code — props, types and defaults are exactly what `src/components/*` implement.

## `AppShell`

Responsive structural layout: a sidebar (drawer on mobile with backdrop, sticky viewport-anchored rail on `lg:`+), a content area, and optional header/footer slots. The mobile drawer is closed automatically once the viewport crosses to desktop (`matchMedia` `min-width: 1024px`).

### Props / Options

| Name | Type | Default | Description |
|---|---|---|---|
| `sidebar` | `Node \| (() => Node)` | — | Sidebar content (required). |
| `content` | `Node \| (() => Node \| null \| undefined)` | — | Main content (required). |
| `header` | `Node \| (() => Node \| null \| undefined)` | — | Top header slot. |
| `footer` | `Node \| (() => Node \| null \| undefined)` | — | Bottom footer slot. |
| `sidebarOpen` | `State<boolean>` | internal `van.state(false)` | Controls the mobile drawer open state; if omitted it is managed internally. |
| `class` | `string` | — | Extra classes for the root flex container. |

### Usage

```ts
import { AppShell } from "vanuikit";

AppShell({
  sidebar: () => Sidebar({ /* see Sidebar */ }),
  header: () => HeaderBar({ title: t("app.title", "Dashboard") }),
  content: () => div("Page content"),
  footer: () => div("Footer"),
});
```

### Notes

- The backdrop is `aria-hidden` when closed and closes the drawer on click.
- The root avoids `overflow-x-hidden` so the sidebar's `position:sticky` works on desktop.

## `Sidebar`

Navigation rail with optional collapse-to-icon-rail mode, desktop-only drag-to-resize, and persistence of both collapsed state and width in `localStorage`. The `collapsed` state is two-way: pass a `State<boolean>` to control it from outside.

### Props / Options

| Name | Type | Default | Description |
|---|---|---|---|
| `header` | `Node \| string \| (() => Node)` | — | Header slot (shown at top, hidden in rail mode). |
| `content` | `Node \| (Node \| HTMLElement \| (() => Node \| null \| undefined) \| null \| undefined)[] \| (() => Node)` | — | Navigation items region (scrolls internally). |
| `footer` | `Node \| string \| (() => Node)` | — | Footer slot, always visible and anchored. |
| `isOpen` | `State<boolean>` | — | Drawer open state (mobile). |
| `onClose` | `() => void` | — | Called by the mobile close button. |
| `collapsible` | `boolean` | `false` | Shows the collapse toggle (desktop only). |
| `collapsed` | `State<boolean>` | internal state | Controlled collapse state; two-way. If omitted with `collapsible`, managed internally. |
| `storageKey` | `string` | `"vanuikit-sidebar-collapsed"` | `localStorage` key for the uncontrolled collapsed state. |
| `resizable` | `boolean` | `false` | Allows resizing the width by dragging the right edge (desktop only). |
| `defaultWidth` | `number` | `256` | Initial width in px when `resizable`. |
| `minWidth` | `number` | `224` | Minimum width in px. |
| `maxWidth` | `number` | `384` | Maximum width in px. |
| `widthStorageKey` | `string` | `"vanuikit-sidebar-width"` | `localStorage` key for the persisted width. |
| `class` | `string` | — | Extra classes. |

### Usage

```ts
import { Sidebar, SidebarGroup, SidebarItem } from "vanuikit";

Sidebar({
  collapsible: true,
  resizable: true,
  header: () => div("Brand"),
  content: SidebarGroup({
    title: t("nav.main", "Main"),
    children: [
      SidebarItem({ href: "/dashboard", label: t("nav.dashboard", "Dashboard") }),
      SidebarItem({ href: "/settings", label: t("nav.settings", "Settings") }),
    ],
  }),
});
```

### Notes

- The resizer is a `role="separator"` with `aria-orientation="vertical"`, `aria-valuenow/min/max`, and keyboard support (←/→ adjust width by 16 px).
- The collapse toggle carries `aria-expanded` and an i18n `aria-label` ("Collapse sidebar"/"Expand sidebar") that depends on the collapsed state.

## `SidebarItem`

A single navigation row rendered as an `<a>` (when `href` is given) or `<button>`. It supports icons, badges, and an active state, and performs embedded SPA navigation via `spaClick`.

### Props / Options

| Name | Type | Default | Description |
|---|---|---|---|
| `href` | `string` | — | Route. When set the item renders as an anchor and navigates via the router; otherwise it renders as a button. |
| `label` | `string \| State<string> \| (() => string \| Node)` | — | Item label (required). |
| `icon` | `string \| Node \| (() => Node)` | — | Optional icon (string is wrapped in a span). |
| `badge` | `string \| number \| State<string \| number> \| Node` | — | Optional badge; when a `State`, it is read reactively. |
| `badgeVariant` | `"primary" \| "secondary" \| "success" \| "warning" \| "danger" \| "neutral"` | `"primary"` | Badge color variant. |
| `active` | `boolean \| State<boolean> \| (() => boolean)` | — | Explicitly controls the active state. |
| `current` | `string \| State<string>` | — | Current route; paired with `href` to compute active via route matching. |
| `onclick` | `(e: MouseEvent) => void` | — | Click handler; runs before embedded navigation. |
| `class` | `string` | — | Extra classes. |

### Usage

```ts
import { SidebarItem } from "vanuikit";

SidebarItem({
  href: "/dashboard",
  label: t("nav.dashboard", "Dashboard"),
  icon: "📊",
  badge: "New",
  current: router.path,
});
```

### Notes

- When active, the item gets `aria-current="page"`.
- A string `label` is also set as `aria-label`, keeping the accessible name stable even when the rail mode hides the visible text.

## `SidebarGroup`

A titled group for `SidebarItem` children, with a styled heading.

### Props / Options

| Name | Type | Default | Description |
|---|---|---|---|
| `title` | `string \| State<string> \| (() => string)` | — | Group heading (rendered as `<h3>`). |
| `class` | `string` | — | Extra classes. |
| children | `(Node \| (() => Node \| null \| undefined) \| null \| undefined)[]` | — | Child items. |

### Usage

```ts
import { SidebarGroup } from "vanuikit";

SidebarGroup(
  { title: t("nav.manage", "Manage") },
  SidebarItem({ href: "/a", label: "A" }),
  SidebarItem({ href: "/b", label: "B" }),
);
```

## `HeaderBar`

Sticky top bar with a leading slot, a reactive title, and an actions zone.

### Props / Options

| Name | Type | Default | Description |
|---|---|---|---|
| `leading` | `Node \| (() => Node \| null \| undefined)` | — | Leading slot (e.g. mobile hamburger). |
| `title` | `string \| State<string> \| Node \| (() => Node \| string)` | — | Title; strings/states render in an `<h1>`. |
| `actions` | `any` | — | Actions zone content. |
| `class` | `string` | — | Extra classes. |

### Usage

```ts
import { HeaderBar } from "vanuikit";

HeaderBar({
  leading: () => button({ class: "lg:hidden", onclick: openDrawer }, "☰"),
  title: t("app.title", "Dashboard"),
  actions: () => div(UserBadge({ auth })),
});
```

### Notes

- A `State` title is read reactively inside an `<h1>` binding; a function title may return either a string (wrapped in `<h1>`) or a node.

## `Link`

Anchor with embedded SPA navigation: clicking runs `navigate(href)` instead of reloading the page. It respects the consumer's `onclick` (`preventDefault` cancels navigation) and the user's modifiers, `target`, and external links (which open natively).

### Props / Options

| Name | Type | Default | Description |
|---|---|---|---|
| `href` | `string` | — | Destination route (required). |
| `variant` | `"default" \| "muted" \| "accent" \| "button" \| "none"` | `"accent"` | Visual style; `"none"` provides no base classes (for consumers that style it themselves). |
| `class` | `string` | `""` | Extra classes. |
| `replace` | `boolean` | `false` | Navigate with `history.replaceState` instead of `pushState`. |
| `external` | `boolean` | `false` | Treat the link as external even if it points at an internal route. |
| `target` | `string` | — | Anchor `target`. |
| `rel` | `string` | — | Anchor `rel`; defaults to `"noopener noreferrer"` when `target="_blank"`. |
| `title` | `string` | — | Anchor `title`. |
| `download` | `string` | — | Anchor `download`. |
| `onclick` | `(e: MouseEvent) => void` | — | Click handler; runs before navigation. |
| `[key: string]` | `any` | — | Extra attributes forwarded to the anchor. |

### Usage

```ts
import { Link } from "vanuikit";

Link({ href: "/docs", variant: "muted" }, "Documentation");
```

### Notes

- Modifier clicks (Ctrl/Cmd), `target`, and external links open natively instead of navigating in-app.

## `Nav`

Horizontal menu of links — the row counterpart of the `Sidebar`. `current` marks the active item (exact match or by subroute) with a highlighted class and `aria-current="page"`. Items are `Link`s with `variant="none"` plus own styling.

### Props / Options

The signature is `Nav(links, props)`.

| Name | Type | Default | Description |
|---|---|---|---|
| `links` | `NavLink[]` | — | Menu items; `NavLink = { href: string; label: string \| State<string> \| (() => string \| Node) }`. |
| `current` | `string \| State<string>` | — | Current route; gets the active class and `aria-current` (required). |
| `ariaLabel` | `string \| State<string>` | `t("nav.ariaLabel", "Main navigation")` | Accessible name of the menu. |
| `class` | `string` | — | Extra classes for the `<nav>` (layout centering/margins). |

### Usage

```ts
import { Nav } from "vanuikit";

Nav(
  [
    { href: "/dashboard", label: t("nav.dashboard", "Dashboard") },
    { href: "/components", label: t("nav.components", "Components") },
  ],
  { current: router.path },
);
```

### Notes

- Only the component is styled; page layout is provided by the consumer via `class`.
- The `aria-label` is resolved once at mount (reacting to locale changes without re-registering derivations).

## `Breadcrumbs`

Navigation trail (`<nav>` + ordered list). Items with `href` use `Link` (SPA navigation with Ctrl/Cmd+click, `target` and external links); the last item carries `aria-current="page"`.

### Props / Options

| Name | Type | Default | Description |
|---|---|---|---|
| `items` | `BreadcrumbItem[]` | — | Trail items (required); `BreadcrumbItem = { label: ToggleText; href?: string; icon?: ChildDom }`. |
| `separator` | `string` | `"/"` | Separator text between items; rendered `aria-hidden`. |
| `ariaLabel` | `ToggleText` | `t("breadcrumbs.ariaLabel", "Breadcrumb")` | Accessible name of the nav. |
| `class` | `string` | — | Extra classes. |
| `[key: string]` | `any` | — | Extra attributes forwarded to the `<nav>`. |

`ToggleText = string | State<string>`.

### Usage

```ts
import { Breadcrumbs } from "vanuikit";

Breadcrumbs({
  items: [
    { label: t("crumb.home", "Home"), href: "/" },
    { label: t("crumb.settings", "Settings"), href: "/settings" },
    { label: t("crumb.profile", "Profile") },
  ],
});
```

### Notes

- Items without `href` render as plain text (typical for the last/current page), which gets `aria-current="page"`.

## `Tabs`

Accessible, reactive tabs with keyboard navigation (←/→/Home/End), ARIA roles (`tablist`, `tab`, `tabpanel`), badges, icons, and visual variants (underline, pills, boxed).

### Props / Options

| Name | Type | Default | Description |
|---|---|---|---|
| `items` | `TabItem[]` | — | Tab definitions (required); `TabItem = { id: string; label: string \| State<string>; icon?: ChildDom; badge?: string \| number \| State<string \| number>; disabled?: boolean; content: () => ChildDom }`. |
| `id` | `string` | — | Optional id used to prefix generated `tab-btn-*`/`tab-panel-*` ids (default prefix `"vui"`). |
| `defaultTab` | `string` | first item id | Initial active tab id (when `activeTab` not supplied; otherwise `activeTab.val`). |
| `activeTab` | `State<string>` | internal state | Controlled active tab id; two-way. |
| `variant` | `"underline" \| "pills" \| "boxed"` | `"underline"` | Visual style. |
| `class` | `string` | — | Extra classes for the root. |
| `tabsClass` | `string` | — | Extra classes for the tablist. |
| `contentClass` | `string` | — | Extra classes for the panels area. |
| `onChange` | `(tabId: string) => void` | — | Called on tab switch (after updating `activeTab`). |

### Usage

```ts
import { Tabs } from "vanuikit";

Tabs({
  items: [
    { id: "overview", label: t("tabs.overview", "Overview"), content: () => div("Overview") },
    { id: "logs", label: t("tabs.logs", "Logs"), badge: 3, content: () => div("Logs") },
  ],
  onChange: (id) => console.log("tab", id),
});
```

### Notes

- Keyboard: ←/→ move between enabled tabs (wrapping), Home/End jump to first/last enabled.
- `TabItem.content` must be a function (not a pre-built node): inactive panels are detached and van drops their bindings; a pre-built node would stay frozen in the language/state of its mount time. Content runs on every activation.
- Disabled tabs are skipped by navigation and get `aria-disabled` and `disabled`.

## `Accordion`

Accessible accordion: buttons with `aria-expanded`/`aria-controls` and `role="region"` panels. With `multiple: false` (default) opening one closes the previous. Content is a factory built on open.

### Props / Options

| Name | Type | Default | Description |
|---|---|---|---|
| `items` | `AccordionItem[]` | — | Items (required); `AccordionItem = { id: string; title: ToggleText; content: () => ValidChildDomValue; disabled?: boolean \| State<boolean> }`. |
| `multiple` | `boolean` | `false` | Allow several open at once. |
| `defaultOpen` | `string[]` | `[]` | Ids open on mount. |
| `class` | `string` | — | Extra classes. |
| `[key: string]` | `any` | — | Extra attributes forwarded to the root `<div>`. |

### Usage

```ts
import { Accordion } from "vanuikit";

Accordion({
  items: [
    { id: "a", title: t("acc.a", "Section A"), content: () => div("A") },
    { id: "b", title: t("acc.b", "Section B"), content: () => div("B") },
  ],
  multiple: true,
});
```

### Notes

- The panel region stays mounted while the item exists (a real anchor); only its content is built when open, and rebuilt on each open (fresh bindings).
- `aria-expanded` and the chevron rotation are reactive to the open set.

## `Card`

Base surface (border + subtle shadow) without imposed padding — the consumer decides spacing (`p-4`/`p-6`, full-bleed).

### Props / Options

| Name | Type | Default | Description |
|---|---|---|---|
| `hoverable` | `boolean` | `false` | Adds a shadow on hover (for clickable cards). |
| `class` | `string` | — | Extra classes. |
| `[key: string]` | `any` | — | Extra attributes forwarded to the `<div>`. |
| children | `ChildDom[]` | — | Card content. |

### Usage

```ts
import { Card, CardTitle } from "vanuikit";

Card({ hoverable: true, class: "p-6" }, CardTitle({}, "Settings"), div("…"));
```

## `CardTitle`

Standard card title, rendered as an `<h3>`.

### Props / Options

| Name | Type | Default | Description |
|---|---|---|---|
| `class` | `string` | — | Extra classes. |
| `[key: string]` | `any` | — | Extra attributes forwarded to the `<h3>`. |
| children | `ChildDom[]` | — | Title content. |

### Usage

```ts
import { CardTitle } from "vanuikit";

CardTitle({}, t("card.title", "Profile"));
```
