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
    test("renderiza el botón y alterna el tema al hacer clic", async () => {
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

    test("variante segmented renderiza los tres modos", async () => {
      const theme = createTheme({ defaultMode: "light" });
      const segmented = ThemeToggle({ theme, variant: "segmented", includeSystem: true });
      van.add(document.body, segmented);

      const buttons = document.body.querySelectorAll("button");
      expect(buttons.length).toBe(3);

      // Clic en Dark
      buttons[1].click();
      await nextTick();
      expect(theme.mode.val).toBe("dark");

      // Clic en System
      buttons[2].click();
      await nextTick();
      expect(theme.mode.val).toBe("system");
    });
  });

  describe("LocaleSelector", () => {
    test("renderiza select con las opciones de idioma y cambia el locale", async () => {
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

    test("variante buttons renderiza botones de idioma", async () => {
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
    test("no renderiza contenido visible si no hay usuario autenticado", () => {
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

    test("renderiza iniciales, email y botón de logout cuando hay usuario", async () => {
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
      expect(document.body.textContent).toContain("Sesión activa");

      const logoutBtn = document.body.querySelector("button");
      expect(logoutBtn).toBeTruthy();

      logoutBtn?.click();
      await nextTick();
      expect(loggedOut).toBe(true);
    });
  });
});
