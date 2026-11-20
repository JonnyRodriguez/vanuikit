# VanUikit

Reactive UI component library for [VanJS](https://vanjs.org/): 41 components,
typed forms, router, auth, reactive i18n and theming, with no UI framework and
no runtime dependencies beyond `vanjs-core`.

## Documentation

- **Public docs portal:** https://vanuikit.pages.dev (Starlight; source in `vanuikit/docs/`), with a static component playground at https://vanuikit.pages.dev/playground/
- **Library README and quick start:** [`vanuikit/README.md`](./vanuikit/README.md)
- **Consumer & AI onboarding guide:** [`vanuikit/docs/AI-GUIDE.md`](./vanuikit/docs/AI-GUIDE.md)
- **Changelog:** [`CHANGELOG.md`](./CHANGELOG.md)

## Packages

| Path | Package | Purpose |
|---|---|---|
| [`vanuikit/`](./vanuikit/) | `vanuikit` | The library published to npm (MIT, `0.3.1`). |
| [`demo/`](./demo/) | private | Demo SPA + Hono server consuming the library. |
| [`docs-site/`](./docs-site/) | private | Starlight portal rendered from `vanuikit/docs/`. |

## Development

    bun install
    bun run build          # library
    bun test               # library tests
    bun run lint           # typecheck + i18n gates + spelling
    bun run dev            # demo SPA + server

To work on the public documentation:

    bun install --cwd docs-site
    bun run docs:dev       # local Starlight server
    bun run docs:build     # synced static site + component playground in docs-site/dist/

`vanuikit/docs/**` is the single source of truth: it ships in the npm tarball and
is copied into the portal automatically. The production docs build also bundles the
standalone component showcase at `/playground/` (client-only, no backend). See
[`docs-site/README.md`](./docs-site/README.md) for deployment instructions (Cloudflare
Pages or GitHub Pages).
