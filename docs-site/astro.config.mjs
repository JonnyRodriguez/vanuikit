import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  // Cloudflare Pages exposes CF_PAGES_URL; override with SITE_URL for a custom domain.
  site: process.env.CF_PAGES_URL || process.env.SITE_URL || "https://vanuikit.pages.dev",
  integrations: [
    starlight({
      title: "VanUikit",
      description:
        "Reactive VanJS component library: 41 components, router, auth, i18n and theming.",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/JonnyRodriguez/vanuikit",
        },
      ],
      // Pagefind indexes the built site at build time: no external service.
      pagefind: true,
      // The host serves its own 404 for static deployments.
      disable404Route: true,
      sidebar: [
        {
          label: "Start here",
          items: [
            { label: "Overview", link: "/" },
            { label: "Consumer & AI guide", link: "/ai-guide/" },
            { label: "Recipes", link: "/recipes/" },
            { label: "Reactivity debugging", link: "/debug-reactivity/" },
          ],
        },
        {
          label: "API reference",
          items: [
            { label: "Form controls", link: "/api/form-controls/" },
            { label: "Overlays & feedback", link: "/api/overlays-feedback/" },
            { label: "Navigation & layout", link: "/api/navigation-layout/" },
            { label: "Data & selection", link: "/api/data-selection/" },
            { label: "Session, theme & i18n", link: "/api/session-theme-i18n/" },
            { label: "Core infrastructure", link: "/api/core-infrastructure/" },
          ],
        },
        {
          label: "Guides",
          items: [
            { label: "Theming", link: "/theming/" },
            { label: "Server", link: "/server/" },
          ],
        },
      ],
    }),
  ],
});
