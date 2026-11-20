# VanUikit docs portal

Public documentation site built with [Starlight](https://starlight.astro.build/) (Astro).
It renders the Markdown files that already ship in the npm package.

## Source of truth

`vanuikit/docs/**` is canonical — it is included in the published tarball and linked
from `vanuikit/README.md`. `src/content/docs/` here is **generated and gitignored**.
Never edit the generated copy: run `bun run docs:sync` (from the repo root) instead.

The sync step adds the frontmatter Starlight needs, maps `README.md` to `/`, and
rewrites relative `*.md` links into clean routes (`/api/form-controls/`, etc.).

## Commands

From the repo root:

    bun install --cwd docs-site   # one time, installs Astro + Starlight here
    bun run docs:dev              # local dev server
    bun run docs:build            # sync + production build -> docs-site/dist/
    bun run docs:sync             # only regenerate the content copy

Astro's `dev` and `build` call `sync` automatically via `predev` / `prebuild`.

## Deploy to Cloudflare Pages (Git integration)

1. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages →
   Connect to Git** and select `JonnyRodriguez/vanuikit`, production branch `main`.
2. Name the project `vanuikit` (URL `https://vanuikit.pages.dev`). Choose carefully:
   a project's `pages.dev` subdomain cannot be changed afterwards.
3. Set the build settings:

   | Setting | Value |
   |---|---|
   | Root directory (advanced) | leave empty (repository root) |
   | Build command | `bun install --cwd docs-site && bun run docs:build` |
   | Build output directory | `docs-site/dist` |

4. Add environment variables under **Settings → Environment variables**:

   | Variable | Value | Why |
   |---|---|---|
   | `NODE_VERSION` | `22` | Astro 7 needs Node 20.19+ |
   | `BUN_VERSION` | `1.4.4` | optional pin; already the v3 build image default |
   | `SKIP_DEPENDENCY_INSTALL` | `1` | optional; skips the root workspace install |
   | `SITE_URL` | `https://your-domain.example` | only when using a custom domain |

   Without `SITE_URL`, Astro uses `CF_PAGES_URL`, which Pages sets automatically.
5. Save and deploy. Every push to `main` publishes; other branches get preview URLs.
   The Pagefind search index is produced during the build, so no service or API key
   is needed. Bun 1.4.4 and Node 22 are preinstalled in the v3 build image.
6. For a custom domain, add it under **Settings → Custom domains**, set `SITE_URL`
   to that URL and redeploy so the sitemap and canonical links are correct.

GitHub Pages works as well: use the same build and publish `docs-site/dist` with a
GitHub Actions deployment workflow (set Astro's `base` if you serve from a subpath).
