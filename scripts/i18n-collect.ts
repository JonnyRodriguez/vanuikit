/**
 * i18n-collect — extracts TEXTS contracts ({ key, default }) from code using
 * the TypeScript compiler and syncs the demo's JSON dictionaries.
 *
 * Objects are detected by their shape (`key` and `default` properties with
 * string literals), without relying on the variable or file name.
 *
 * Modes:
 *   bun scripts/i18n-collect.ts           → writes demo/shared/locales/
 *   bun scripts/i18n-collect.ts --check   → CI: does not write; exit 1 on conflicts or gaps
 *   bun scripts/i18n-collect.ts --prune   → also removes obsolete keys from es/fr
 *
 * Dictionary policy (since 0.2.0 the canonical defaults are ENGLISH):
 *   - en.json is fully GENERATED from the t()/TEXTS defaults (don't edit it
 *     by hand: the canonical English lives next to its use in code).
 *   - es.json / fr.json are edited by hand (translations): the script preserves
 *     their content, never fills them in (missing keys fall back to the English
 *     default at runtime); gaps are reported and --check fails if they exist.
 *   - Keys that no longer exist in any TEXTS are reported as stale and are only
 *     removed from es/fr with --prune.
 */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { defaultLocales } from "../vanuikit/src/i18n.js";

const ROOT = path.resolve(import.meta.dir, "..");
const SCAN_PATTERNS = ["demo/**/*.ts", "vanuikit/src/**/*.ts"];
const EXCLUDE = [/(^|\/)dist\//, /(^|\/)node_modules\//, /\.test\.ts$/, /(^|\/)fixtures\//];
const LOCALES_DIR = path.join(ROOT, "demo", "shared", "locales");
const HAND_LOCALES = ["es", "fr"] as const;

const CHECK = process.argv.includes("--check");
const PRUNE = process.argv.includes("--prune");

type Entry = { key: string; default: string; file: string };

function* scanSources(): Generator<string> {
  for (const pattern of SCAN_PATTERNS) {
    const glob = new Bun.Glob(pattern);
    for (const rel of glob.scanSync({ cwd: ROOT })) {
      if (EXCLUDE.some((re) => re.test(rel))) continue;
      yield rel;
    }
  }
}

/** Objects with string-literal `key` and `default`, found by shape. */
function collectEntries(file: string): Entry[] {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TS,
  );
  const found: Entry[] = [];
  const add = (key: string | undefined, fallback: string | undefined): void => {
    if (key !== undefined && fallback !== undefined) {
      found.push({ key, default: fallback, file: path.relative(ROOT, file) });
    }
  };
  const calleePath = (expr: ts.Expression): string =>
    ts.isIdentifier(expr) ? expr.text
      : ts.isPropertyAccessExpression(expr) ? `${calleePath(expr.expression)}.${expr.name.text}`
      : "";

  const visit = (node: ts.Node): void => {
    // Current convention: t("key", "default" [, params]) and raw(...); also i18n.t/i18n.raw.
    if (ts.isCallExpression(node)) {
      const callee = calleePath(node.expression);
      if (callee === "t" || callee === "raw" || callee === "i18n.t" || callee === "i18n.raw") {
        const [key, fallback] = node.arguments;
        if (key && ts.isStringLiteral(key)) {
          if (!fallback) { add(key.text, undefined); return; }
          if (ts.isStringLiteral(fallback) || ts.isNoSubstitutionTemplateLiteral(fallback)) {
            add(key.text, fallback.text);
          } else if (ts.isTemplateExpression(fallback)) {
            // `Minimum: {min} of {max}` — placeholders come from the aliases of the
            // params object when they exist (min: params.monto_minimo),
            // and otherwise from the expression name.
            const aliasByValue = new Map<string, string>();
            const paramsObj = node.arguments[2];
            if (paramsObj && ts.isObjectLiteralExpression(paramsObj)) {
              for (const prop of paramsObj.properties) {
                if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
                  // Whitespace-insensitive: multiline expressions in the default
                  // and in the params object may be formatted differently.
                  const norm = prop.initializer.getText(source).replace(/\s+/g, "");
                  aliasByValue.set(norm, prop.name.text);
                }
              }
            }
            const paramName = (expr: ts.Expression): string => {
              const alias = aliasByValue.get(expr.getText(source).replace(/\s+/g, ""));
              if (alias) return alias;
              if (ts.isIdentifier(expr)) return expr.text;
              if (ts.isPropertyAccessExpression(expr)) return expr.name.text;
              return "valor";
            };
            const parts = [fallback.head.text];
            for (const span of fallback.templateSpans) {
              parts.push(`{${paramName(span.expression)}}`, span.literal.text);
            }
            add(key.text, parts.join(""));
          }
        }
      }
    }

    // Legacy format (TEXTS contract): objects with `key` and `default` literals.
    if (ts.isObjectLiteralExpression(node)) {
      let key: string | undefined;
      let fallback: string | undefined;
      for (const prop of node.properties) {
        if (!ts.isPropertyAssignment(prop)) continue;
        if (!ts.isStringLiteral(prop.initializer)) continue;
        const name = ts.isIdentifier(prop.name) ? prop.name.text : (prop.name as ts.StringLiteral).text;
        if (name === "key") key = prop.initializer.text;
        if (name === "default") fallback = prop.initializer.text;
      }
      add(key, fallback);
    }

    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

/** Sorted nested tree built from dotted keys ("a.b.c"). */
function buildTree(entries: Entry[]): Record<string, unknown> {
  const tree: Record<string, any> = {};
  for (const { key, default: fallback } of entries) {
    const parts = key.split(".");
    let node = tree;
    for (const part of parts.slice(0, -1)) node = (node[part] ??= {});
    node[parts[parts.length - 1]] = fallback;
  }
  const sort = (obj: Record<string, unknown>): Record<string, unknown> =>
    Object.fromEntries(
      Object.keys(obj)
        .sort()
        .map((k) => [k, obj[k] && typeof obj[k] === "object" ? sort(obj[k] as Record<string, unknown>) : obj[k]]),
    );
  return sort(tree);
}

/** Flattens a nested dictionary into dotted keys. */
function flatten(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const full = prefix ? `${prefix}.${k}` : k;
    return v && typeof v === "object" ? flatten(v as Record<string, unknown>, full) : [full];
  });
}

const readJson = (locale: string): Record<string, unknown> => {
  const file = path.join(LOCALES_DIR, `${locale}.json`);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
};

// ── 1. Collection ───────────────────────────────────────────────────────────
const entries: Entry[] = [];
for (const file of scanSources()) entries.push(...collectEntries(path.join(ROOT, file)));

const errors: string[] = [];
const byKey = new Map<string, Entry>();
for (const entry of entries) {
  const prev = byKey.get(entry.key);
  if (prev && prev.default !== entry.default) {
    errors.push(`conflicto: "${entry.key}" tiene defaults distintos en ${prev.file} y ${entry.file}`);
  } else {
    byKey.set(entry.key, entry);
  }
}

const allKeys = [...byKey.keys()].sort();

// ── 2. Library validation: vanuikit keys present in es+en ───────────────────────
for (const [key, entry] of byKey) {
  if (!entry.file.startsWith("vanuikit/")) continue;
  for (const locale of ["es", "en"]) {
    const resolved = key
      .split(".")
      .reduce<any>((acc, part) => (acc == null ? undefined : acc[part]), defaultLocales[locale]);
    if (typeof resolved !== "string") {
      errors.push(`vanuikit: "${key}" falta en defaultLocales.${locale} (declared en ${entry.file})`);
    }
  }
}

// ── 3. State of the manual dictionaries (es/fr) ──────────────────────────────
const handState = new Map<string, { missing: string[]; stale: string[] }>();
for (const locale of HAND_LOCALES) {
  const dict = readJson(locale);
  const present = new Set(flatten(dict));
  const missing = allKeys.filter((k) => !present.has(k));
  const stale = [...present].filter((k) => !byKey.has(k)).sort();
  handState.set(locale, { missing, stale });
}

// ── 4. Report ────────────────────────────────────────────────────────────────
console.log(`TEXTS detectados: ${allKeys.length} llaves en ${new Set(entries.map((e) => e.file)).size} archivos`);

for (const [locale, { missing, stale }] of handState) {
  if (missing.length) {
    console.log(`\n[${locale}] sin traducción (${missing.length}, caen al inglés en runtime):`);
    for (const key of missing) console.log(`  - ${key} = "${byKey.get(key)!.default}"`);
  }
  if (stale.length) {
    console.log(`\n[${locale}] obsoletas (${stale.length}${PRUNE ? ", eliminadas" : ", usa --prune para eliminar"}):`);
    for (const key of stale) console.log(`  - ${key}`);
  }
}

for (const error of errors) console.error(`ERROR ${error}`);

// ── 5. Writing ───────────────────────────────────────────────────────────────
if (!CHECK) {
  fs.mkdirSync(LOCALES_DIR, { recursive: true });
  const enFile = path.join(LOCALES_DIR, "en.json");
  const previousEn = fs.existsSync(enFile) ? flatten(JSON.parse(fs.readFileSync(enFile, "utf8"))) : [];
  const addedToEn = allKeys.filter((k) => !previousEn.includes(k));
  fs.writeFileSync(enFile, JSON.stringify(buildTree([...byKey.values()]), null, 2) + "\n");
  console.log(`\nen.json regenerado (${allKeys.length} llaves${addedToEn.length ? `, +${addedToEn.length} nuevas` : ""})`);

  for (const locale of HAND_LOCALES) {
    if (!PRUNE) continue;
    const { stale } = handState.get(locale)!;
    if (!stale.length) continue;
    const remove = (obj: Record<string, any>, key: string): void => {
      const parts = key.split(".");
      let node = obj;
      for (const part of parts.slice(0, -1)) {
        node = node[part];
        if (!node) return;
      }
      delete node[parts[parts.length - 1]];
    };
    const dict = readJson(locale);
    for (const key of stale) remove(dict, key);
    fs.writeFileSync(path.join(LOCALES_DIR, `${locale}.json`), JSON.stringify(dict, null, 2) + "\n");
    console.log(`${locale}.json podido (-${stale.length})`);
  }
}

const hasGaps = [...handState.values()].some(({ missing }) => missing.length > 0);
if (CHECK ? errors.length || hasGaps : errors.length) {
  console.error(`\ni18n:check FALLÓ (${errors.length} errores${hasGaps ? ", huecos de traducción en es/fr" : ""})`);
  process.exit(1);
}
console.log(CHECK ? "\ni18n:check OK" : "\ni18n:collect OK");
