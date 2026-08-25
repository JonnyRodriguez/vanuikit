// demo/components/header.component.ts
import { van, Nav, type NavLink } from "vanui";
import { authState } from "../app.js";

export function Header(currentPath: string = "/") {
  const { header, div, span, a } = van.tags;

  const links: NavLink[] = [
    { href: "/gateways", label: "Pasarelas" },
    { href: "/components", label: "Componentes" },
  ];

  return header(
    {
      class:
        "w-full border-b border-border bg-background/80 backdrop-blur sticky top-0 z-40 px-4 py-3 mb-6",
    },
    div(
      { class: "max-w-5xl mx-auto flex items-center justify-between" },
      a(
        {
          href: "/gateways",
          class: "flex items-center gap-2 font-bold text-foreground tracking-tight text-lg no-underline",
        },
        span({ class: "text-primary font-extrabold" }, "VanUI"),
        span({ class: "text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20" }, "Demo"),
      ),
      div(
        { class: "flex items-center gap-3" },
        Nav(links, { current: currentPath }),
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
                "Salir",
              )
            : a(
                {
                  href: "/login",
                  class: "text-sm bg-primary text-primary-fg px-3 py-1.5 rounded-md font-medium no-underline",
                },
                "Acceder",
              ),
      ),
    ),
  );
}
