import { describe, test, expect, beforeEach } from "bun:test";
import van from "vanjs-core";
import { createTheme } from "../src/theme.js";
import { createI18n } from "../src/i18n.js";
import { createAuth } from "../src/auth.js";
import { ThemeToggle } from "../src/components/theme-toggle.js";
import { LocaleSelector } from "../src/components/locale-selector.js";
import { UserBadge } from "../src/components/user-badge.js";

const nextTick = () => new Promise((resolve) => setTimeout(resolve, 10));

describe("Embedded Core Components", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
    document.documentElement.className = "";
  });

  describe("ThemeToggle", () => {
    test("renders the button and toggles the theme on click", async () => {
      const theme = createTheme({ defaultMode: "light" });
      const toggle = ThemeToggle({ theme, includeSystem: false });
      van.add(document.body, toggle);

      const btn = document.body.querySelector("button");
      expect(btn).toBeTruthy();
      expect(theme.mode.val).toBe("light");

      btn?.click();
      await nextTick();
      expect(theme.mode.val).toBe("dark");

      btn?.click();
      await nextTick();
      expect(theme.mode.val).toBe("light");
    });

    test("segmented variant renders the three modes", async () => {
      const theme = createTheme({ defaultMode: "light" });
      const segmented = ThemeToggle({ theme, variant: "segmented", includeSystem: true });
      van.add(document.body, segmented);

      const buttons = document.body.querySelectorAll("button");
      expect(buttons.length).toBe(3);

      // Click on Dark
      buttons[1].click();
      await nextTick();
      expect(theme.mode.val).toBe("dark");

      // Click on System
      buttons[2].click();
      await nextTick();
      expect(theme.mode.val).toBe("system");
    });

    test("each segmented radio has an accessible name (icons are visual only)", () => {
      const theme = createTheme({ defaultMode: "light" });
      // i18n with empty dicts: resolves the canonical defaults (English).
      const i18n = createI18n({ defaultLocale: "es", locales: {} });
      const segmented = ThemeToggle({ theme, i18n, variant: "segmented", includeSystem: true });
      van.add(document.body, segmented);

      const labels = [...document.body.querySelectorAll('[role="radio"]')].map((el) =>
        el.getAttribute("aria-label"),
      );
      expect(labels).toEqual(["Light", "Dark", "System"]);

      const group = document.body.querySelector('[role="radiogroup"]');
      expect(group?.getAttribute("aria-label")).toBe("Select visual theme");
    });
  });

  describe("LocaleSelector", () => {
    test("renders a select with locale options and changes the locale", async () => {
      const i18n = createI18n({
        defaultLocale: "es",
        locales: {
          es: { lang: { es: "Español", en: "English" } },
          en: { lang: { es: "Español", en: "English" } },
        },
      });

      const selector = LocaleSelector({ i18n });
      van.add(document.body, selector);

      const selectEl = document.body.querySelector("select");
      expect(selectEl).toBeTruthy();
      expect(selectEl?.value).toBe("es");

      if (selectEl) {
        selectEl.value = "en";
        selectEl.dispatchEvent(new Event("change"));
      }
      await nextTick();
      expect(i18n.currentLocale.val).toBe("en");
    });

    test("buttons variant renders language buttons", async () => {
      const i18n = createI18n({
        defaultLocale: "es",
        locales: {
          es: { lang: { es: "Español", en: "English" } },
          en: { lang: { es: "Español", en: "English" } },
        },
      });

      const selector = LocaleSelector({ i18n, variant: "buttons" });
      van.add(document.body, selector);

      const buttons = document.body.querySelectorAll("button");
      expect(buttons.length).toBe(2);

      buttons[1].click();
      await nextTick();
      expect(i18n.currentLocale.val).toBe("en");
    });
  });

  describe("UserBadge", () => {
    test("renders no visible content when there is no authenticated user", () => {
      const auth = createAuth({
        me: async () => ({ user: null }),
        login: async () => ({ user: null }),
        logout: async () => {},
      });

      const badge = UserBadge({ auth });
      van.add(document.body, badge);

      const el = document.body.querySelector("div");
      expect(el?.classList.contains("hidden")).toBe(true);
    });

    test("renders initials, email and a logout button when there is a user", async () => {
      let loggedOut = false;
      const auth = createAuth({
        me: async () => ({ user: null }),
        login: async () => ({ user: { id: "1", email: "alice@example.com", name: "Alice Smith" } }),
        logout: async () => {
          loggedOut = true;
        },
      });

      const badge = UserBadge({ auth, onLogout: () => { loggedOut = true; } });
      van.add(document.body, badge);

      await auth.login("alice@example.com", "secret");
      await nextTick();

      expect(document.body.textContent).toContain("AS");
      expect(document.body.textContent).toContain("Alice Smith");
      expect(document.body.textContent).toContain("Active session");

      const logoutBtn = document.body.querySelector("button");
      expect(logoutBtn).toBeTruthy();

      logoutBtn?.click();
      await nextTick();
      expect(loggedOut).toBe(true);
    });

    test("compact mode: avatar only + icon-only logout, reactive to the state", async () => {
      const auth = createAuth({
        me: async () => ({ user: null }),
        login: async () => ({ user: { id: "1", email: "alice@example.com", name: "Alice Smith" } }),
        logout: async () => {},
      });

      const compact = van.state(false);
      // Connect to the document: van discards bindings of detached trees
      const host = document.createElement("div");
      document.body.appendChild(host);
      van.add(host, UserBadge({ auth, compact, onLogout: () => {} }));

      await auth.login("alice@example.com", "secret");
      await nextTick();

      // Expanded: card with name and status
      expect(host.textContent).toContain("Alice Smith");

      compact.val = true;
      await nextTick();

      // Compact: avatar with initials + logout with accessible name; no visible name
      expect(host.textContent).not.toContain("Alice Smith");
      expect(host.textContent).toContain("AS");
      const logoutBtn = host.querySelector("button") as HTMLButtonElement;
      expect(logoutBtn).toBeTruthy();
      expect(logoutBtn.getAttribute("aria-label")).toBe("Sign out");
      expect(logoutBtn.getAttribute("title")).toBe("Sign out");
      const avatar = host.querySelector("[title='Alice Smith']");
      expect(avatar).not.toBeNull();
      host.remove();
    });
  });
});
