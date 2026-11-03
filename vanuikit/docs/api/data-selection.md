# Data & selection

This reference documents the VanUikit data-display and data-entry components: tables and grids, pagination, the combobox and date picker inputs, and the visual primitives they are built with (badges, avatars, icons, and SVG helpers). All of them are re-exported from the `vanuikit` package and follow the catalog-wide reactivity contract: visual props accept `van.State` values, and `van` is imported from `"vanuikit"` (never from `vanjs-core`).

## `Table`

`Table` is a fully client-side data table with built-in reactive search, bidirectional column sorting, optional multi-select and pagination. All processing (filter, sort, paginate, select) is driven by internal `van.State` values, so the UI re-renders automatically when the data or sorting/search state changes.

### Props

| Name | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | — | Optional id applied to the root element. |
| `columns` | `TableColumn<T>[]` | *(required)* | Column definitions (header/sortability/render). |
| `data` | `T[] \| State<T[]>` | *(required)* | Rows to display. Accepts a plain array or a reactive `State<T[]>`. |
| `keyField` | `string` | — | Row identity field used for keys and selection. Falls back to `row.id`, then the row index. |
| `emptyText` | `string \| State<string>` | `"No data available"` | Message shown when there are no rows. |
| `pageSize` | `number` | — | When set to a positive number, enables built-in client-side pagination (previous / `x / y` / next). |
| `searchable` | `boolean` | — | When true, renders a search box that filters rows by any column value. |
| `searchPlaceholder` | `string \| State<string>` | `"Search the table..."` | Placeholder for the search box. |
| `selectable` | `boolean` | — | When true, renders a checkbox column with select-all plus row selection. |
| `selectedRows` | `State<T[]>` | internal state | Controlled selection. If omitted, a component-internal `State` is used. |
| `onSelectionChange` | `(selected: T[]) => void` | — | Called with the new selection whenever it changes. |
| `class` | `string` | — | Extra classes appended to the root container. |

### `TableColumn` fields

| Name | Type | Default | Description |
|---|---|---|---|
| `key` | `string` | *(required)* | The row field this column renders. |
| `header` | `string \| State<string>` | *(required)* | Column title; accepts a reactive `State<string>`. |
| `render` | `(row: T, index: number) => ChildDom` | — | Custom cell renderer. Defaults to `row[key]` (rendered as `-` when missing). |
| `sortable` | `boolean` | — | When true, the header is clickable and toggles asc/desc. |
| `align` | `"left" \| "center" \| "right"` | — | Cell and header text alignment. |
| `width` | `string` | — | Inline `width` style for the header cell. |
| `compare` | `(a: T, b: T) => number` | — | Custom comparator for sorting. Defaults to numeric/string comparison on the column value. |

### Usage

```ts
import { van, Table, type TableColumn } from "vanuikit";

const columns: TableColumn<SampleUser>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "role", header: "Role", sortable: true },
  { key: "status", header: "Status", sortable: true, render: (row) => Badge({ text: row.status, variant: "success" }) },
  { key: "created", header: "Created", sortable: true, align: "right" },
];

const users = van.state<SampleUser[]>([/* … */]);
const selection = van.state<SampleUser[]>([]);

Table({
  columns,
  data: users,
  searchable: true,
  searchPlaceholder: "Search…",
  pageSize: 10,
  selectable: true,
  selectedRows: selection,
  onSelectionChange: (sel) => console.log(sel),
});
```

### Notes

- Sorting, search and pagination are all backed by internal reactive state; changing `data` (a `State<T[]>`) or interacting with the table re-renders automatically.
- Searching resets the current page to 1.
- Selection is two-way: pass `selectedRows` to control it, and read `onSelectionChange` for external side-effects. Selection identity uses `keyField` (or `row.id` / index).
- Column headers and UI strings are i18n-aware (`header`, `emptyText`, `searchPlaceholder` accept `State<string>`; the built-in placeholders go through `t()`).

## `DataGrid`

`DataGrid` is a semantic alias of `Table` (its export is literally the same function). Prefer it for "full data table" use cases; it shares every prop and behavior documented above.

### Usage

```ts
import { DataGrid, type TableColumn } from "vanuikit";

DataGrid({
  columns,
  data: users,
  searchable: true,
  pageSize: 20,
  selectable: true,
  selectedRows: selection,
});
```

### Notes

- Identical API to `Table` — there is no separate prop set.
- The demo uses `DataGrid` for search + sort + pagination + multi-selection tables.

## `Pagination`

`Pagination` is a standalone numbered pagination component: a `<nav>` with prev/next buttons and a page-number range with ellipsis. It exposes two-way `page` (accepts an external `State<number>`), the current page has `aria-current="page"`, and prev/next are disabled at the ends.

### Props

| Name | Type | Default | Description |
|---|---|---|---|
| `page` | `number \| State<number>` | *(required)* | Current page (1-based). Pass a `State<number>` for two-way binding. |
| `totalPages` | `number \| State<number>` | *(required)* | Total number of pages. Accepts a `State` for dynamic lists. |
| `siblingCount` | `number` | `1` | Visible sibling pages around the current page before ellipsis kicks in. |
| `ariaLabel` | `ToggleText` | `"Pagination"` | Accessible label for the `<nav>`. |
| `class` | `string` | — | Extra classes appended to the root `<nav>`. |

### Usage

```ts
import { van, Pagination } from "vanuikit";

const page = van.state(1);
Pagination({ page, totalPages: 12, siblingCount: 1 });
```

### Notes

- `page` and `totalPages` are clamped to `[1, totalPages]`; writes to `page` are clamped even when an external `State` is supplied.
- The page range is computed by `pageSlots` (first and last pages always visible, `…` where trimmed).
- Prev `‹`, next `›` and page buttons are `<button>` elements; the current page is non-interactive and carries `aria-current="page"`.

## `pageSlots`

Helper that computes the page-number range (including ellipsis markers) for a given page, total pages and sibling count. It is the same helper `Pagination` uses internally.

### Signature

```ts
pageSlots(page: number, totalPages: number, siblingCount: number): (number | "ellipsis-l" | "ellipsis-r")[]
```

Returns an array of page numbers with `"ellipsis-l"` / `"ellipsis-r"` markers where the range is trimmed. First and last pages are always included; when `totalPages <= siblingCount * 2 + 5` every page is returned without ellipsis.

### Usage

```ts
import { pageSlots } from "vanuikit";

pageSlots(3, 12, 1); // [1, "ellipsis-l", 2, 3, 4, "ellipsis-r", 12]
```

## `Combobox`

`Combobox` is a WAI-ARIA combobox: the input filters options as you type and owns the whole keyboard (↑/↓ navigate, Home/End jump, Enter selects, Esc closes, click-outside closes) using `aria-activedescendant` over a listbox. It implements the `Field` contract, so it integrates with `Form` and validators. With `multiple: true` the selection renders as removable chips and does not close the panel on pick.

### Props

| Name | Type | Default | Description |
|---|---|---|---|
| `options` | `ComboboxOption[]` | *(required)* | Selectable options. |
| `name` | `string` | `"combobox"` | Field name; also the input id and hidden-input name for `FormData`. |
| `value` | `string \| State<string> \| State<string[]>` | — | Selected value. With `multiple: true` it must be a `State<string[]>`. |
| `multiple` | `boolean` | — | Multi-select mode: removable chips; the panel stays open on pick. |
| `placeholder` | `ToggleText` | `"Search..."` | Input placeholder. |
| `disabled` | `boolean \| State<boolean>` | — | Disables the input and the whole interaction. |
| `required` | `boolean` | — | Error on submit with no selection (integration with `Form`). |
| `requiredMsg` | `ToggleText` | `"Please select an option"` | Message for the required validator. |
| `class` | `string` | — | Extra classes on the field container. |

### `ComboboxOption` fields

| Name | Type | Default | Description |
|---|---|---|---|
| `value` | `string` | *(required)* | Option value (sent to `FormData`). |
| `label` | `ToggleText` | *(required)* | Visible label; accepts a `State<string>`. |
| `disabled` | `boolean \| State<boolean>` | — | Disables this option. |

### Usage

```ts
import { van, Combobox } from "vanuikit";

const country = van.state("ar");
Combobox({
  name: "country",
  value: country,
  options: [
    { value: "ar", label: "Argentina" },
    { value: "co", label: "Colombia" },
  ],
}).dom();

const langs = van.state<string[]>(["es"]);
Combobox({
  name: "langs",
  multiple: true,
  value: langs,
  options: [
    { value: "es", label: "Spanish" },
    { value: "en", label: "English" },
  ],
}).dom();
```

### Notes

- Returns a `ComboboxField` (`ControlField<{ dom(): HTMLElement }>`); call `.dom()` to insert it as a child, exactly like other fields.
- The selected value travels in a hidden input so `FormData` receives `option.value`. In `multiple` mode `FormData` collapses repeated values, so read `field.value.val` to get the full selection.
- Single mode: closed shows the selection label; open shows the typed query. Multi mode: the input always shows the query and the selection lives in the chips (removed via the × button or Backspace with an empty input).
- Keyboard: ↑/↓ (open + navigate), Home/End, Enter (select), Esc (close), Tab (close). `aria-activedescendant`, `aria-expanded`, `aria-invalid` and `aria-multiselectable` are wired.
- Labels, placeholder and empty-state text are i18n-aware via `t()`/`raw()`.

## `DatePicker`

`DatePicker` is a date-picking calendar inspired by the jQuery UI DatePicker (month navigation, day grid, popup/inline), localized through `Intl` (month/day names and weekday headers come from the locale) and reactive to language changes. It implements the `Field` contract and supports two modes: `inline` (calendar always visible) and popup (read-only input that opens the calendar on click).

### Props

| Name | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | — | Field name; used as the label id and hidden-input name for `FormData`. |
| `value` | `Date \| null \| State<Date \| null>` | — | Selected date. Accepts `Date` or a `State<Date \| null>` for two-way binding. |
| `label` | `ToggleText` | — | Optional field label (a `<label>` is rendered). |
| `placeholder` | `ToggleText` | `"Select a date"` | Input placeholder (popup mode). |
| `disabled` | `boolean \| State<boolean>` | — | Disables the input and calendar. |
| `required` | `boolean` | — | Error on submit with no date (integration with `Form`). |
| `requiredMsg` | `ToggleText` | — | Message for the required validator. |
| `min` | `Date \| null \| State<Date \| null>` | — | Minimum selectable date (earlier days disabled). Accepts a reactive `State`. |
| `max` | `Date \| null \| State<Date \| null>` | — | Maximum selectable date (later days disabled). Accepts a reactive `State`. |
| `inline` | `boolean` | — | true = calendar always visible (no input/popup). |
| `firstDayOfWeek` | `number` | `1` (Monday) | First day of the week: 0=Sunday … 6=Saturday. |
| `class` | `string` | — | Extra classes on the field container. |

### Usage

```ts
import { van, DatePicker } from "vanuikit";

const due = van.state<Date | null>(new Date(2026, 0, 15));

DatePicker({ name: "due-date", label: "Due date", value: due, required: true }).dom();
DatePicker({ inline: true, value: due, min: new Date(2026, 0, 1), max: new Date(2026, 11, 31) }).dom();
```

### Notes

- Returns a `DatePickerField` (`ControlField<{ dom(): HTMLElement }>`); call `.dom()` to insert it as a child.
- Modeled with `Date` objects; the hidden input carries an ISO `YYYY-MM-DD` string for `FormData`.
- Localization comes from `Intl` on the active `currentLocale`, so month/day labels reformat when the language changes. Because the calendar re-renders on locale change, keep label/derive reads hoisted outside render functions (see the container rule).
- Grid keyboard: arrows (day/week), PageUp/PageDown (month), Shift+PageUp/PageDown (year), Home/End (first/last of month), Ctrl+Home/End (first/last of year), Enter (select), Esc (close).

## `Avatar`

`Avatar` renders a circular avatar showing a `src` image or, when loading fails or no image is given, the initials of `name` over the primary color. It exposes `name` and `title`/`aria-label` reactively and supports four sizes.

### Props

| Name | Type | Default | Description |
|---|---|---|---|
| `name` | `ToggleText` | — | Name used for the initials (and `title`/`aria-label`). Accepts a `State<string>`. |
| `src` | `string` | — | Image source; on error (or when absent) initials are shown. |
| `size` | `AvatarSize` | `"md"` | `"xs"` \| `"sm"` \| `"md"` \| `"lg"`. |
| `class` | `string` | — | Extra classes on the root element. |
| `onclick` | `(e: MouseEvent) => void` | — | Passed through to the root element's click handler. |

### `getInitials` signature

```ts
getInitials(name: string, fallback?: string): string
```

Returns the first letter of the first two words (uppercased), or the first two letters when there is only one word. With no words it returns `fallback` (default `"?"`), truncated to two characters.

### Usage

```ts
import { Avatar } from "vanuikit";

Avatar({ name: "Ana Morales", size: "lg" });
Avatar({ name: "Ana Morales", src: "/avatars/ana.jpg", size: "sm" });
```

### Notes

- The initials fallback is shared with `UserBadge` (same `getInitials` helper).
- The `name`-based `title`/`aria-label`, `alt` and initials are reactive derives, so they follow a `State<string>` `name`.

## `Badge`

`Badge` is a small status label with color and size variants, an optional status dot, and an optional `text` or `children`. It uses theme semantic tokens so the colors read well in both light and dark mode.

### Props

| Name | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | — | Optional id on the root span. |
| `text` | `string \| number \| State<string \| number>` | — | Text content; accepts a reactive `State`. |
| `variant` | `BadgeVariant` | `"primary"` | `"primary"` \| `"secondary"` \| `"success"` \| `"warning"` \| `"danger"` \| `"outline"`. |
| `size` | `BadgeSize` | `"md"` | `"sm"` \| `"md"` \| `"lg"`. |
| `dot` | `boolean` | — | Renders a small status dot (colored by variant). |
| `class` | `string` | — | Extra classes on the root span. |
| `children` | `any` | — | Additional children rendered after `text`. |

### Usage

```ts
import { Badge } from "vanuikit";

Badge({ text: "Active", variant: "success", size: "sm" });
Badge({ variant: "warning", dot: true, text: "Pending" });
```

## `Icon`

`Icon` renders a named icon from the built-in catalog as an `<svg>` with a real namespace and `currentColor` stroke (so it inherits the surrounding text color). Icons are Lucide-style 24×24 stroked paths; every icon in the catalog must come from here rather than emojis.

### Props

| Name | Type | Default | Description |
|---|---|---|---|
| `name` | `IconName` | *(required)* | Which icon to render (see the name union below). |
| `class` | `string \| (() => string) \| State<string>` | — | Size classes (default `size-4`) and extras. |

### `IconName` values

`sun`, `moon`, `monitor`, `chevron-left`, `chevron-right`, `x`, `check`, `menu`, `search`, `globe`, `credit-card`, `puzzle`, `key`, `log-out`, `info`, `alert-triangle`, `bell`, `question`, `check-circle`, `x-circle`, `trash`, `inbox`, `smartphone`, `rocket`, `navigation`, `user`, `settings`, `arrow-right`.

### Usage

```ts
import { Icon } from "vanuikit";

Icon({ name: "search", class: "size-4" });
Icon({ name: "chevron-right" });
```

### Notes

- The `<svg>` is `aria-hidden="true"` and stroke-tinted with `currentColor`; wrap or label it for accessible meaning where needed.
- Built on `Svg`/`SvgPath` (see below); the `name` union is exhaustive and the only allowed icon source.

## `Svg` / `SvgPath`

Low-level SVG helpers that create `<svg>` and `<path>` elements in the real SVG namespace (`document.createElementNS`). In VanJS `van.tags.svg` creates an element in the HTML namespace, so child `<path>` elements are not rendered as vectors — these wrappers are the only correct way. `Icon` (and internal components like `Checkbox`) are built on them.

### `Svg` Props

| Name | Type | Default | Description |
|---|---|---|---|
| `viewBox` | `string` | — | SVG viewBox. |
| `fill` | `string` | — | Fill attribute. |
| `stroke` | `string` | — | Stroke attribute. |
| `style` | `string` | — | Inline style. |
| `class` | `string \| (() => string) \| State<string>` | — | Classes; accepts a function or a `State<string>`. |
| `"aria-hidden"` | `string \| boolean` | — | Accessibility attribute. |
| *other* | `any` | — | Any additional attributes are passed through. |

### `SvgPath` Props

| Name | Type | Default | Description |
|---|---|---|---|
| `d` | `string` | *(required)* | Path data. |
| `class` | `string \| (() => string) \| State<string>` | — | Classes for the `<path>`. |
| *other* | `any` | — | Any additional attributes are passed through. |

### Usage

```ts
import { Svg, SvgPath } from "vanuikit";

Svg(
  { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2" },
  SvgPath({ d: "M20 6 9 17l-5-5" }),
);
```

### Notes

- `SvgPath` inherits fill/stroke from its parent `Svg`. `Svg` uses the SVG namespace so children render as vectors.
- `Svg` is a drop-in replacement for `van.tags.svg`; use it whenever you need inline SVG in the catalog.
