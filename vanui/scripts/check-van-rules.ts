/**
 * check-van-rules.ts — escaneo estático de las reglas reactivas de VanUI.
 *
 * Complementa el detector en runtime (debug-graph.ts) con la versión
 * **lexical** de las reglas: no necesita ejecutar la app.
 *
 *  RULE A (falla el CI): `van.state()` / `van.derive()` DENTRO de un
 *    `van.derive(...)` — el estado se recrea en cada recálculo; el derive
 *    anidado se registra como setter del contenedor.
 *
 *  RULE B (advertencia): `t()` / `raw()` / `fmt.*()` dentro de una función
 *    pasada como argumento de una llamada (función-hija / render). Si el
 *    contenedor reacciona, reconstruye todo el subárbol.
 *
 * Uso: `bun run check:van` (exit 1 si hay violaciones RULE A).
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

  // 1) RULE A: van.state / van.derive dentro de van.derive.
  const visitForA = (node: ts.Node, deriveDepth: number): void => {
    if (ts.isCallExpression(node)) {
      const callee = node.expression.getText(sf);
      if (CALLEE_DERIVE.test(callee)) {
        if (deriveDepth > 0) {
          violations.push({
            file: rel,
            ...pos(sf, node),
            msg: "van.derive anidado dentro de otro van.derive (se registra como setter del contenedor).",
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
          msg: "van.state() creado dentro de van.derive (se recrea en cada recálculo). Izá el estado fuera del derive.",
          snippet: snippet(sf, node),
        });
      }
    }
    ts.forEachChild(node, (c) => visitForA(c, deriveDepth));
  };

  // 2) RULE B: t/raw/fmt dentro de funciones pasadas como argumento.
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
      if (ts.isFunctionLike(node) && node !== fn) return; // handlers anidados: no bajar
      if (ts.isCallExpression(node)) {
        const callee = node.expression.getText(sf);
        if (CALLEE_I18N.test(callee)) {
          warnings.push({
            file: rel,
            ...pos(sf, node),
            msg: `${callee}() dentro de una función pasada como hijo — si el contenedor reacciona, reconstruye el subárbol. Izá el State fuera (o usa renderIntentional si es intencional).`,
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
            msg: "van.derive anidado dentro de otro van.derive (se registra como setter del contenedor).",
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
          msg: "van.state() creado dentro de van.derive (se recrea en cada recálculo). Izá el estado fuera del derive.",
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
  console.warn(`⚠️  RULE B (revisar) — ${w.file}:${w.line}:${w.col} — ${w.msg}`);
  console.warn(`    ${w.snippet}`);
}

console.log(`\n✔ check-van-rules: ${files.length} archivos, ${violations.length} violaciones, ${warnings.length} advertencias.`);
if (violations.length > 0) process.exit(1);
