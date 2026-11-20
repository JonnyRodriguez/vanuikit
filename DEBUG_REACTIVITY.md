# Debugging reactivity in VanUikit

Tools to **detect at the moment of violation** the silent reactive rules of
VanJS (the ones that don't throw an error and only manifest as intermittent
bugs, e.g. the DatePicker that didn't show its grid when changing language).

The system has three pieces that complement each other:

1. **Runtime instrumenter** (`vanuikit/src/debug-graph.ts`) — wraps
   `van.state`/`van.derive` and builds the real dependency tree, shouting
   with the exact source when a rule is broken.
2. **Visual view** (`demo/pages/debug.page.ts`, route `/debug`) — draws the
   dependency graph and the diagnostics.
3. **Static scan** (`vanuikit/scripts/check-van-rules.ts`, `bun run check:van`)
   — the lexical version of the rules, to run in CI without executing the app.

None of this goes into the production bundle: it's an **opt-in debug mode**.

---

## 1. The rules it detects

| Code | Rule | How it's detected |
|---|---|---|
| R1 | `van.state()` created inside `van.derive` (or inside a render). The state is recreated on every recalculation and loses its identity. | runtime + static (A) |
| R2 | A derive **writes** states during its computation (reactive feedback). | runtime |
| R2b | The derive reads and writes the same state → cycle. | runtime |
| R3 | A derive with no reads → not reactive (is it using `raw()`/`t().val`?). | runtime |
| R4 | Render function that reads reactive states → it will rebuild its subtree when those states change (the container rule). | runtime via `trackRender` + static (B, warning) |

The single-instance rule (two copies of `vanjs-core`) is already covered by the
demo build (`check-single-vanjs.js`), not by these tools.

---

## 2. Runtime instrumenter — `installVanDebug(van)`

It lives in `vanuikit/src/debug-graph.ts` and is exported from `"vanuikit"`.

```ts
import { van, installVanDebug } from "vanuikit";

const debug = installVanDebug(van);
// ... start the app ...
debug.printTree();      // tree in console: derive → states
debug.dump();           // serializable graph { states, derives, diagnostics }
debug.diagnostics();    // accumulated diagnostics
debug.clear();          // clears everything (useful in tests)
debug.configure({ silent: true }); // accumulates without printing
```

### `trackRender` / `renderIntentional` (rule R4)

The container rule can't be detected on its own: the reactive read may be
intentional (deliberate rebuild, documented in AGENTS.md). Two helpers:

```ts
// Check a suspicious container: if it reads states, report R4.
debug.trackRender(() => myContainer());

// Mark as intentional: silence R4 for that function.
const render = debug.renderIntentional(() => readStatesDeliberately());
```

### Activation in the demo

In `demo/main.ts` the instrumenter is installed only when debug mode is
active. Two equivalent ways:

- `localStorage.setItem("van-debug", "1")` and reload.
- Open with the `?van-debug` parameter in the URL.

With mode active, every violation is printed to the console with its source:

```
[vanuikit:debug] state-in-derive — van.state() created inside derive "getPageTitle" — ...
  at <anonymous> (demo/pages/foo.page.ts:42:17)
```

---

## 3. Visual view — `/debug`

With debug mode active, navigating to `/debug` (public route registered in
`demo/app.ts`) shows:

- **SVG graph**: derives (left column) → states (right).
  - Solid arrow = the derive reads that state.
  - **Red dashed** arrow = the derive writes it during its computation
    (feedback / cycle).
  - Nodes: orange = derive with writes; yellow = derive with no deps.
- **Diagnostics panel**: cards per violated rule with the exact source.
- **Buttons**: “Refresh graph” (re-dump from `window.__vanDebug`) and
  “Clear diagnostics”.

---

## 4. Static scan — `bun run check:van`

In `vanuikit/`:

```bash
cd vanuikit
bun run check:van
```

It analyzes with AST all `.ts` files in `vanuikit/src` and `demo` (excludes
node_modules and dist):

- **RULE A (fails, exit 1)** — `van.state()` / `van.derive()` lexically
  inside `van.derive(...)`. Ideal for CI: it's detected when writing the code,
  not when the bug manifests.
- **RULE B (warning, exit 0)** — `t()`/`raw()`/`fmt.*()` inside a
  function passed as a child. May include legitimate cases; review manually.

Output:

```
❌ RULE A — ../src/components/foo.ts:12:7 — van.state() created inside van.derive (…)
⚠️  RULE B (review) — ../src/components/table.ts:209:21 — t(...) inside a function passed as a child (…)
✔ check-van-rules: 79 files, 0 violations, 37 warnings.
```

> Note: the scan is lexical (it doesn't execute the app); for dynamic detection
> use the instrumenter (section 2).

---

## 5. Tests

`vanuikit/tests/debug-graph.test.ts` covers the instrumenter: R1, R2, R2b, R3,
R4, `renderIntentional`, idempotency, and that VanJS semantics are preserved
(asynchronous recomputation). Run:

```bash
cd vanuikit
bun test tests/debug-graph.test.ts
```

---

## 6. Recommended workflow

1. **Before writing new code** that uses `van.state`/`van.derive`/`t()`/
   `raw()`, run `bun run check:van` — if RULE A fails, the fix is
   immediate and cheap.
2. **During interactive development**, enable debug mode in the demo
   (`?van-debug`) and watch the console: any live violation appears with its
   source.
3. **When an intermittent reactive bug shows up** (like the DatePicker):
   enable debug mode, reproduce the bug, and open `/debug`. The graph shows
   which containers read states (R4) and which derives write (R2); the
   diagnostics panel points to the file and line.
4. Fix (usually: lift the `State` out of the function / use
   `renderIntentional` if it's deliberate) and re-run `check:van` + tests.

---

## 7. Cost and scope

- **Production: zero.** The instrumenter is only imported conditionally in
  `demo/main.ts` (dynamic import) and is not part of the normal flow. The
  helpers have no effects when imported.
- **Development: minimal.** One extra read per `.val` access while a
  tracking frame is running.
- **Known limitations.** The runtime doesn't detect rule R4 automatically
  in child functions (you have to go through `trackRender`); the static scan
  is lexical and may report false positives in RULE B (warning, not a
  failure). The ~1s GC bugs require tests with real waits (see AGENTS.md).
