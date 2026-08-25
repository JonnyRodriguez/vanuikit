// demo/components/header.component.ts
import { van, Nav, Button, type NavLink } from "vanui";
import { authState } from "../app.js";
import { i18n } from "../shared/i18n.config.js";
import { theme } from "../shared/theme.config.js";

export function Header(currentPath: string = "/") {
  const { header, div, span, a, button } = van.tags;

  const links: NavLink[] = [
    { href: "/***REMOVED***", label: i18n.t("nav.***REMOVED***") },
    { href: "/components", label: i18n.t("nav.components") },
  ];

  const cycleTheme = () => {
    if (theme.mode.val === "system") theme.setMode("dark");
    else if (theme.mode.val === "dark") theme.setMode("light");
    else theme.setMode("system");
  };

  const toggleLang = () => {
    i18n.setLocale(i18n.currentLocale.val === "es" ? "en" : "es");
  };

  const themeIcon = van.derive(() => {
    if (theme.mode.val === "system") return "💻 Auto";
    return theme.mode.val === "dark" ? "🌙 Dark" : "☀️ Light";
  });

  const langLabel = van.derive(() => {
    return i18n.currentLocale.val === "es" ? "🌐 ES" : "🌐 EN";
  });

  return header(
    {
      class:
        "w-full border-b border-border bg-background/80 backdrop-blur sticky top-0 z-40 px-4 py-3 mb-6 transition-colors",
    },
    div(
      { class: "max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3" },
      a(
        {
          href: "/***REMOVED***",
          class: "flex items-center gap-2 font-bold text-foreground tracking-tight text-lg no-underline",
        },
        span({ class: "text-primary font-extrabold" }, "VanUI"),
        span({ class: "text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20" }, "Demo"),
      ),
      div(
        { class: "flex items-center gap-3" },
        Nav(links, { current: currentPath, class: "my-0 px-0" }),

        // Selector de Idioma
        button(
          {
            type: "button",
            class:
              "text-xs px-2.5 py-1 rounded border border-border bg-background hover:bg-secondary/40 text-foreground font-medium cursor-pointer transition-colors",
            title: "Cambiar idioma / Switch language",
            onclick: toggleLang,
          },
          langLabel,
        ),

        // Selector de Tema
        button(
          {
            type: "button",
            class:
              "text-xs px-2.5 py-1 rounded border border-border bg-background hover:bg-secondary/40 text-foreground font-medium cursor-pointer transition-colors",
            title: "Alternar tema (Claro / Oscuro / Sistema)",
            onclick: cycleTheme,
          },
          themeIcon,
        ),

        // Auth action
        () =>
          authState.user.val
            ? a(
                {
                  href: "#logout",
                  class: "text-sm text-foreground-soft hover:text-foreground cursor-pointer px-2 py-1",
                  onclick: async (e: MouseEvent) => {
                    e.preventDefault();
                    await authState.logout();
                    window.location.pathname = "/login";
                  },
                },
                i18n.t("nav.logout"),
              )
            : a(
                {
                  href: "/login",
                  class: "text-sm bg-primary text-primary-fg px-3 py-1.5 rounded-md font-medium no-underline hover:opacity-90 transition-opacity",
                },
                i18n.t("nav.login"),
              ),
      ),
    ),
  );
}
