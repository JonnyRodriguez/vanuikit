# VanUikit

[![npm](https://img.shields.io/npm/v/vanuikit)](https://www.npmjs.com/package/vanuikit)
[![CI](https://github.com/JonnyRodriguez/vanuikit/actions/workflows/ci.yml/badge.svg)](https://github.com/JonnyRodriguez/vanuikit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Reactive UI component library for [VanJS](https://vanjs.org/): accessible
components, typed forms, SPA router, auth helpers, reactive i18n and theming —
with no UI framework and no runtime dependencies beyond `vanjs-core`.

## Links

- **Docs:** https://vanuikit.pages.dev
- **Component playground (static, no backend):** https://vanuikit.pages.dev/playground/
- **npm:** https://www.npmjs.com/package/vanuikit
- **Library README & quick start:** [`vanuikit/README.md`](./vanuikit/README.md)
- **AI/consumer guide:** [`vanuikit/docs/AI-GUIDE.md`](./vanuikit/docs/AI-GUIDE.md)
- **Changelog:** [`vanuikit/CHANGELOG.md`](./vanuikit/CHANGELOG.md)

## Quick start

```bash
bun add vanuikit vanjs-core
```

```ts
import "vanuikit/styles.css";
import { van, Button, toast } from "vanuikit";

van.add(document.body, Button({ onclick: () => toast.success("It works!") }, "Greet"));
```

> Import `van` from `vanuikit` (not directly from `vanjs-core`) to keep a single VanJS instance in your bundle.

## Packages

| Path | Package | Purpose |
|---|---|---|
| [`vanuikit/`](./vanuikit/) | [`vanuikit`](https://www.npmjs.com/package/vanuikit) | The library published to npm (MIT). |
| [`demo/`](./demo/) | private | Demo SPA + Hono server consuming the library. |
| [`docs-site/`](./docs-site/) | private | Starlight portal rendered from `vanuikit/docs/`. |

## Development

```bash
bun install
bun run build          # library
bun run test           # library tests (bun test)
bun run lint           # typecheck + i18n gates + spelling
bun run dev            # demo
```

Documentation:

```bash
bun install --cwd docs-site
bun run docs:dev       # local Starlight server
bun run docs:build     # synced docs + static playground in docs-site/dist/
```

`vanuikit/docs/**` is the single source of truth (shipped in the npm package and
synced into the portal). See [`docs-site/README.md`](./docs-site/README.md) for
deployment details and [`CONTRIBUTING.md`](./CONTRIBUTING.md) for contribution
guidelines.
