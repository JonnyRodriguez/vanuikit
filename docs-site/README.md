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

## Deploy to Cloudflare Pages

Connect the GitHub repo as a static Pages project:

- **Root directory:** repository root
- **Build command:** `bun install --cwd docs-site && bun run docs:build`
- **Build output directory:** `docs-site/dist`
- **Environment:** `NODE_VERSION=22` (Astro 7 needs Node 20.19+)

Every push to `main` publishes automatically. Pagefind's search index is produced
during the build, so no service or API key is needed.

GitHub Pages works as well: use the same build and publish `docs-site/dist` with a
GitHub Actions deployment workflow (set Astro's `base` if you serve from a subpath).
