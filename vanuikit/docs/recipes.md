# Recipes — real usage patterns

Composed examples using the library's embedded components. Each one is a
self-contained, realistic pattern for an SPA.

> All examples import `van` and components from `"vanuikit"` — never from
> `"vanjs-core"` (single-instance rule).

---

## 1. Authenticated dashboard shell

`AppShell` + `Sidebar` + `HeaderBar` + `UserBadge` + `ThemeToggle`:

```ts
import { van, AppShell, Sidebar, SidebarGroup, SidebarItem,
         HeaderBar, UserBadge, ThemeToggle, createTheme } from "vanuikit";

const theme = createTheme({ defaultMode: "system", storageKey: "my-theme" });

function Dashboard(user: User) {
  const collapsed = van.state(false);
  const sidebar = Sidebar({
    header: "My App",
    content: [
      SidebarGroup("General",
        SidebarItem({ href: "/dashboard", label: "Dashboard", icon: "📊", current: router.path }),
        SidebarItem({ href: "/settings", label: "Settings", icon: "⚙️", current: router.path }),
      ),
    ],
    footer: UserBadge({ auth, onLogout: () => auth.logout(), compact: collapsed }),
    collapsible: true,
    collapsed,
  });

  return AppShell({
    sidebar,
    header: HeaderBar({
      leading: van.tags.button({ onclick: () => sidebarOpen.val = true }, "☰"),
      title: "Dashboard",
      actions: [ThemeToggle({ theme, variant: "segmented" })],
    }),
    content: () => <DashboardContent user={user} />,
  });
}
```

---

## 2. Form inside a Modal + imperative confirmation

```ts
import { van, Button, EmailField, PasswordField, Form, Modal,
         confirmDialog, toast } from "vanuikit";

const form = Form(async (data) => {
  const ok = await confirmDialog({
    title: "Confirm sign up",
    message: "Create the account?",
    confirmText: "Create",
    variant: "primary",
  });
  if (!ok) return;
  await signup(data);
  toast.success("Account created");
});

form.add(EmailField(), PasswordField());

const modal = Modal();
modal.mount();
modal.set(
  {
    title: "Sign up",
    body: () => form.dom(Button({ type: "submit", block: true }, "Create account")),
  },
  true,
);
```

Note: `confirmDialog` returns a `Promise<boolean>` — use it inside async
handlers, never inside a render function.

---

## 3. Searchable / sortable DataGrid

```ts
import { DataGrid, type TableColumn } from "vanuikit";

const columns: TableColumn<User>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "email", header: "Email", sortable: true },
  { key: "role", header: "Role", render: (u) => u.role === "admin" ? "👑 Admin" : u.role },
];

DataGrid({
  columns,
  data: usersState,        // State<User[]> or array
  keyField: "id",
  searchable: true,
  pageSize: 10,
});
```

---

## 4. Locale-aware DatePicker in a form

```ts
import { DatePicker, Form, Button } from "vanuikit";

const form = Form(async (data) => {
  // data.birthday = Date (or null if not required)
});

const birthday = DatePicker({
  name: "birthday",
  label: "Birthday",
  required: true,
  max: new Date(),
});

form.add(birthday);
form.add(Button({ type: "submit" }, "Save"));
```

`DatePicker` respects the active locale (`createI18n`) for calendar labels —
create the instance once at the top level, not inside a render function.

---

## 5. Language switcher

```ts
import { createI18n, LocaleSelector } from "vanuikit";

const i18n = createI18n({
  defaultLocale: "en",
  locales: {
    en: { greeting: "Hello {name}" },
    es: { greeting: "Hola {name}" },
  },
});

LocaleSelector({ i18n, variant: "buttons" }); // or "select"
i18n.setLocale("es"); // persists + syncs <html lang>
```
