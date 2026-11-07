/**
 * App — orchestrator of the VanUikit demo SPA.
 *
 * Configures:
 * - Routes with authentication guards (`requireAuth`)
 * - Authentication state (`createAuth`)
 * - Dashboard / responsive AppShell layout with Sidebar, HeaderBar and Mobile-First support
 */
import {
  van,
  createAuth,
  requireAuth,
  createRouter,
  AppShell,
  Sidebar,
  SidebarGroup,
  SidebarItem,
  HeaderBar,
  Link,
  ThemeToggle,
  LocaleSelector,
  UserBadge,
  Icon,
  navigate,
} from "vanuikit";
import { LoginPage } from "./pages/login.page.js";
import { RegisterPage } from "./pages/register.page.js";
import { ***REMOVED***Page } from "./pages/***REMOVED***.page.js";
import { ComponentsPage } from "./pages/components.page.js";
import { ChatPage } from "./pages/chat.page.js";
import { DebugPage } from "./pages/debug.page.js";
import { i18n } from "./shared/i18n.config.js";
import { theme } from "./shared/theme.config.js";

// Authorization header with the token managed by createAuth (centralized persistence).
const authHeaders = (): Record<string, string> => {
  const token = authState.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Session state
export const authState = createAuth({
  me: async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        headers: { Accept: "application/json", ...authHeaders() },
      });
      if (!res.ok) return { user: null, token: null };
      const data = await res.json();
      return {
        user: data.data?.user || data.user || null,
        token: data.data?.token || data.token || authState.getToken(),
      };
    } catch {
      return { user: null, token: null };
    }
  },
  login: async (email, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || i18n.raw("login.errGeneric", "Error signing in"));
    }
    const data = await res.json();
    return {
      user: data.data?.user || data.user,
      token: data.data?.token || data.token,
    };
  },
  register: async (registerData) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "include",
      body: JSON.stringify(registerData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || i18n.raw("register.errGeneric", "Error creating account"));
    }
    const data = await res.json();
    return {
      user: data.data?.user || data.user,
      token: data.data?.token || data.token,
    };
  },
  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include", headers: authHeaders() });
    } catch {}
  },
});

// Application Router singleton
// Deny-by-default: with `guard`, EVERY route is protected except those in
// publicRoutes. Adding a new page = protected without writing anything;
// the only things declared are the public ones (login, register, showcase).
export const router = createRouter({
  guard: requireAuth(authState, "/login"),
  publicRoutes: ["/login", "/register", "/components", "/debug"],
});

router
  .add("/login", () => LoginPage())
  .add("/register", () => RegisterPage())
  .add("/***REMOVED***", () => ***REMOVED***Page())
  .add("/components", () => ComponentsPage())
  .add("/chat", () => ChatPage())
  .add("/debug", () => DebugPage())
  .redirect("/", "/***REMOVED***");

export function App() {
  void authState.boot().then(() => {
    router.resolve();
  });

  const { span, button } = van.tags;
  const sidebarOpen = van.state(false);
  // Controlled state of the desktop collapse of the Sidebar (icon rail).
  const sidebarCollapsed = van.state(false);

  const getPageTitle = van.derive(() => {
    const p = router.path.val;
    if (p.startsWith("/***REMOVED***")) return i18n.raw("***REMOVED***.title", "***REMOVED*** & Top-up Methods");
    if (p.startsWith("/components")) return i18n.raw("components.title", "Component Showcase");
    if (p.startsWith("/chat")) return i18n.raw("chat.title", "Chat");
    if (p.startsWith("/login")) return i18n.raw("login.title", "Sign In");
    if (p.startsWith("/register")) return i18n.raw("register.title", "Create Account");
    return i18n.raw("nav.dashboard", "Dashboard");
  });

  return AppShell({
    sidebarOpen,
    sidebar: Sidebar({
      onClose: () => {
        sidebarOpen.val = false;
      },
      collapsible: true,
      collapsed: sidebarCollapsed,
      storageKey: "vanuikit-demo-sidebar-collapsed",
      resizable: true,
      widthStorageKey: "vanuikit-demo-sidebar-width",
      // vanuikit Link: embedded SPA navigation; the demo only provides its state
      // (close the mobile drawer when the logo is clicked).
      header: Link(
        {
          href: "/***REMOVED***",
          class: "flex items-center gap-2.5 font-bold text-foreground tracking-tight text-lg no-underline",
          onclick: () => {
            sidebarOpen.val = false;
          },
        },
        span({ class: "text-primary font-black text-xl" }, "VanUikit"),
        span(
          {
            class:
              "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20",
          },
          i18n.t("nav.dashboard", "Dashboard"),
        ),
      ),
      content: [
        SidebarGroup(
          { title: i18n.t("nav.platform", "Platform") },
          SidebarItem({
            href: "/***REMOVED***",
            label: i18n.t("nav.***REMOVED***", "***REMOVED***"),
            icon: Icon({ name: "credit-card", class: "size-[18px]" }),
            current: router.path,
            onclick: () => {
              sidebarOpen.val = false;
            },
          }),
          SidebarItem({
            href: "/components",
            label: i18n.t("nav.components", "Components"),
            icon: Icon({ name: "puzzle", class: "size-[18px]" }),
            badge: "17",
            badgeVariant: "secondary",
            current: router.path,
            onclick: () => {
              sidebarOpen.val = false;
            },
          }),
          SidebarItem({
            href: "/chat",
            label: i18n.t("nav.chat", "Chat"),
            icon: Icon({ name: "inbox", class: "size-[18px]" }),
            current: router.path,
            onclick: () => {
              sidebarOpen.val = false;
            },
          }),
        ),
        () =>
          !authState.user.val
            ? SidebarGroup(
                { title: i18n.t("nav.account", "Account") },
                SidebarItem({
                  href: "/login",
                  label: i18n.t("nav.login", "Sign In"),
                  icon: Icon({ name: "key", class: "size-[18px]" }),
                  current: router.path,
                  onclick: () => {
                    sidebarOpen.val = false;
                  },
                }),
                SidebarItem({
                  href: "/register",
                  label: i18n.t("nav.register", "Sign Up"),
                  icon: Icon({ name: "user", class: "size-[18px]" }),
                  current: router.path,
                  onclick: () => {
                    sidebarOpen.val = false;
                  },
                }),
              )
            : null,
      ],
      // Sidebar footer using the embedded user component.
      // Compact ONLY on the desktop rail: if the mobile drawer is open
      // (sidebarOpen), the card shows complete with labels.
      footer: UserBadge({
        auth: authState,
        i18n,
        compact: van.derive(() => sidebarCollapsed.val && !sidebarOpen.val),
        onLogout: () => navigate("/login"),
      }),
    }),
    header: HeaderBar({
      leading: button(
        {
          type: "button",
          class:
            "lg:hidden p-2 rounded-lg text-foreground hover:bg-secondary border border-border cursor-pointer text-base flex items-center justify-center",
          "aria-label": i18n.t("nav.menuOpen", "Open menu"),
          onclick: () => {
            sidebarOpen.val = !sidebarOpen.val;
          },
        },
        Icon({ name: "menu" }),
      ),
      title: getPageTitle,
      actions: [
        // Embedded language selector from VanUikit
        LocaleSelector({ i18n }),

        // Embedded theme selector from VanUikit
        ThemeToggle({ theme, i18n }),
      ],
    }),
    content: router.start(),
  });
}

