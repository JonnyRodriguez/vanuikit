/**
 * i18n-collect — extrae los contratos TEXTS ({ key, default }) del código con
 * el compilador de TypeScript y sincroniza los diccionarios JSON de la demo.
 *
 * Los objetos se detectan por su forma (propiedades `key` y `default` con
 * literales de string), sin depender del nombre de la variable ni del archivo.
 *
 * Modos:
 *   bun scripts/i18n-collect.ts           → escribe demo/shared/locales/
 *   bun scripts/i18n-collect.ts --check   → CI: no escribe; exit 1 ante conflictos o huecos
 *   bun scripts/i18n-collect.ts --prune   → además elimina llaves obsoletas de en/fr
 *
 * Política de diccionarios:
 *   - es.json se GENERA completo desde los defaults de TEXTS (no editar a mano).
 *   - en.json / fr.json son editados a mano: el script conserva su contenido,
 *     nunca los rellena con español (las llaves ausentes caen al default en
 *     runtime); los huecos se reportan y --check falla si existen.
 *   - Las llaves que ya no existen en ningún TEXTS se reportan como obsoletas
 *     y solo se eliminan de en/fr con --prune.
 */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { defaultLocales } from "../vanui/src/i18n.js";

const ROOT = path.resolve(import.meta.dir, "..");
const SCAN_PATTERNS = ["demo/**/*.ts", "vanui/src/**/*.ts"];
const EXCLUDE = [/(^|\/)dist\//, /(^|\/)node_modules\//, /\.test\.ts$/, /(^|\/)fixtures\//];
const LOCALES_DIR = path.join(ROOT, "demo", "shared", "locales");
const HAND_LOCALES = ["en", "fr"] as const;

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

/** Objetos con `key` y `default` literales de string, hallados por forma. */
function collectEntries(file: string): Entry[] {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TS,
  );
  const found: Entry[] = [];
  const visit = (node: ts.Node): void => {
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
      if (key !== undefined && fallback !== undefined) {
        found.push({ key, default: fallback, file: path.relative(ROOT, file) });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

/** Árbol anidado ordenado a partir de llaves punteadas ("a.b.c"). */
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

/** Aplana un diccionario anidado a llaves punteadas. */
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

// ── 1. Recolección ──────────────────────────────────────────────────────────
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

// ── 2. Validación de la librería: claves de vanui presentes en es+en ───────
for (const [key, entry] of byKey) {
  if (!entry.file.startsWith("vanui/")) continue;
  for (const locale of ["es", "en"]) {
    const resolved = key
      .split(".")
      .reduce<any>((acc, part) => (acc == null ? undefined : acc[part]), defaultLocales[locale]);
    if (typeof resolved !== "string") {
      errors.push(`vanui: "${key}" falta en defaultLocales.${locale} (declared en ${entry.file})`);
    }
  }
}

// ── 3. Estado de los diccionarios manuales (en/fr) ──────────────────────────
const handState = new Map<string, { missing: string[]; stale: string[] }>();
for (const locale of HAND_LOCALES) {
  const dict = readJson(locale);
  const present = new Set(flatten(dict));
  const missing = allKeys.filter((k) => !present.has(k));
  const stale = [...present].filter((k) => !byKey.has(k)).sort();
  handState.set(locale, { missing, stale });
}

// ── 4. Reporte ──────────────────────────────────────────────────────────────
console.log(`TEXTS detectados: ${allKeys.length} llaves en ${new Set(entries.map((e) => e.file)).size} archivos`);

for (const [locale, { missing, stale }] of handState) {
  if (missing.length) {
    console.log(`\n[${locale}] sin traducción (${missing.length}, caen al español en runtime):`);
    for (const key of missing) console.log(`  - ${key} = "${byKey.get(key)!.default}"`);
  }
  if (stale.length) {
    console.log(`\n[${locale}] obsoletas (${stale.length}${PRUNE ? ", eliminadas" : ", usa --prune para eliminar"}):`);
    for (const key of stale) console.log(`  - ${key}`);
  }
}

for (const error of errors) console.error(`ERROR ${error}`);

// ── 5. Escritura ────────────────────────────────────────────────────────────
if (!CHECK) {
  fs.mkdirSync(LOCALES_DIR, { recursive: true });
  const esFile = path.join(LOCALES_DIR, "es.json");
  const previousEs = fs.existsSync(esFile) ? flatten(JSON.parse(fs.readFileSync(esFile, "utf8"))) : [];
  const addedToEs = allKeys.filter((k) => !previousEs.includes(k));
  fs.writeFileSync(esFile, JSON.stringify(buildTree([...byKey.values()]), null, 2) + "\n");
  console.log(`\nes.json regenerado (${allKeys.length} llaves${addedToEs.length ? `, +${addedToEs.length} nuevas` : ""})`);

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
  console.error(`\ni18n:check FALLÓ (${errors.length} errores${hasGaps ? ", huecos de traducción en en/fr" : ""})`);
  process.exit(1);
}
console.log(CHECK ? "\ni18n:check OK" : "\ni18n:collect OK");
