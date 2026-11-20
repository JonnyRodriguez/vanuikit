/**
 * check-van-rules.ts — static scan of VanUikit's reactivity rules.
 *
 * Complements the runtime detector (debug-graph.ts) with the **lexical**
 * version of the rules: it doesn't need to run the app.
 *
 *  RULE A (fails CI): `van.state()` / `van.derive()` INSIDE a
 *    `van.derive(...)` — the state is recreated on every recomputation; the
 *    nested derive registers as the container's setter.
 *
 *  RULE B (warning): `t()` / `raw()` / `fmt.*()` inside a function
 *    passed as a call argument (function-child / render). If the
 *    container reacts, it rebuilds the whole subtree.
 *
 * Usage: `bun run check:van` (exit 1 on RULE A violations).
 */

import ts from "typescript";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const HERE = new URL(".", import.meta.url).pathname;
const ROOTS = [join(HERE, "..", "src"), join(HERE, "..", "..", "demo")];

interface Finding {
  file: string;
  line: number;
  col: number;
  msg: string;
  snippet: string;
}

const violations: Finding[] = [];
const warnings: Finding[] = [];

function collectFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist" || entry === ".git") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectFiles(full, acc);
    } else if (extname(full) === ".ts" && !full.endsWith(".d.ts")) {
      acc.push(full);
    }
  }
  return acc;
}

function pos(sf: ts.SourceFile, node: ts.Node): { line: number; col: number } {
  const p = sf.getLineAndCharacterOfPosition(node.getStart(sf));
  return { line: p.line + 1, col: p.character + 1 };
}

function snippet(sf: ts.SourceFile, node: ts.Node): string {
  return node.getText(sf).replace(/\s+/g, " ").slice(0, 90);
}

const CALLEE_DERIVE = /(^|[.\s])derive$/;
const CALLEE_STATE = /(^|[.\s])state$/;
const CALLEE_I18N = /^(t|raw|fmt)(\.|\(|$)/;

function scanFile(file: string): void {
  const source = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const rel = relative(HERE, file);

  // 1) RULE A: van.state / van.derive inside van.derive.
  const visitForA = (node: ts.Node, deriveDepth: number): void => {
    if (ts.isCallExpression(node)) {
      const callee = node.expression.getText(sf);
      if (CALLEE_DERIVE.test(callee)) {
        if (deriveDepth > 0) {
          violations.push({
            file: rel,
            ...pos(sf, node),
            msg: "van.derive nested inside another van.derive (it registers as the container's setter).",
            snippet: snippet(sf, node),
          });
        }
        for (const arg of node.arguments) {
          if (ts.isFunctionLike(arg)) scanFunctionA(arg, deriveDepth + 1, sf, rel);
        }
        return;
      }
      if (deriveDepth > 0 && callee.includes("van") && CALLEE_STATE.test(callee)) {
        violations.push({
          file: rel,
          ...pos(sf, node),
          msg: "van.state() created inside van.derive (it is recreated on every recomputation). Hoist the state out of the derive.",
          snippet: snippet(sf, node),
        });
      }
    }
    ts.forEachChild(node, (c) => visitForA(c, deriveDepth));
  };

  // 2) RULE B: t/raw/fmt inside functions passed as arguments.
  const renderFns: ts.FunctionLikeDeclaration[] = [];
  const collectRenderFns = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      for (const arg of node.arguments) {
        if (ts.isFunctionLike(arg) && !arg.name) renderFns.push(arg);
      }
    }
    ts.forEachChild(node, collectRenderFns);
  };

  visitForA(sf, 0);
  collectRenderFns(sf);
  for (const fn of renderFns) {
    const visitB = (node: ts.Node): void => {
      if (ts.isFunctionLike(node) && node !== fn) return; // nested handlers: don't descend
      if (ts.isCallExpression(node)) {
        const callee = node.expression.getText(sf);
        if (CALLEE_I18N.test(callee)) {
          warnings.push({
            file: rel,
            ...pos(sf, node),
            msg: `${callee}() inside a function passed as a child — if the container reacts, it rebuilds the subtree. Hoist the State out (or use renderIntentional if intentional).`,
            snippet: snippet(sf, node),
          });
          return;
        }
      }
      ts.forEachChild(node, visitB);
    };
    visitB(fn);
  }
}

function scanFunctionA(fn: ts.FunctionLikeDeclaration, depth: number, sf: ts.SourceFile, rel: string): void {
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const callee = node.expression.getText(sf);
      if (CALLEE_DERIVE.test(callee)) {
        if (depth > 0) {
          violations.push({
            file: rel,
            ...pos(sf, node),
            msg: "van.derive nested inside another van.derive (it registers as the container's setter).",
            snippet: snippet(sf, node),
          });
        }
        for (const arg of node.arguments) {
          if (ts.isFunctionLike(arg)) scanFunctionA(arg, depth + 1, sf, rel);
        }
        return;
      }
      if (depth > 0 && callee.includes("van") && CALLEE_STATE.test(callee)) {
        violations.push({
          file: rel,
          ...pos(sf, node),
          msg: "van.state() created inside van.derive (it is recreated on every recomputation). Hoist the state out of the derive.",
          snippet: snippet(sf, node),
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(fn);
}

const files = ROOTS.flatMap((r) => collectFiles(r));
for (const f of files) scanFile(f);

for (const v of violations) {
  console.error(`❌ RULE A — ${v.file}:${v.line}:${v.col} — ${v.msg}`);
  console.error(`    ${v.snippet}`);
}
for (const w of warnings) {
  console.warn(`⚠️  RULE B (review) — ${w.file}:${w.line}:${w.col} — ${w.msg}`);
  console.warn(`    ${w.snippet}`);
}

console.log(`\n✔ check-van-rules: ${files.length} files, ${violations.length} violations, ${warnings.length} warnings.`);
if (violations.length > 0) process.exit(1);
