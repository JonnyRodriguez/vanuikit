/**
 * i18n-fix — codemod asistido que convierte strings de UI detectados por
 * `i18n-scan` en llamadas `t()`/`raw()` con su entrada de TEXTS.
 *
 * Por cada hallazgo ALTA en demo/**: propone una llave (editable), agrega la
 * entrada al TEXTS del archivo (lo crea si no existe), completa el import de
 * `t`/`raw` desde "vanui" y reemplaza el literal. Los templates interpolados
 * se convierten en parámetros `{ nombre }`. Al terminar ejecuta
 * `i18n:collect` para regenerar es.json; los huecos en/fr los reporta
 * `i18n:check`.
 *
 * Modos:
 *   bun scripts/i18n-fix.ts            → interactivo (confirma llave por llave)
 *   bun scripts/i18n-fix.ts --yes      → acepta todas las propuestas
 *   bun scripts/i18n-fix.ts --dry      → muestra el plan sin escribir
 *
 * Los archivos de vanui/src se excluyen a propósito: sus componentes siguen el
 * patrón de instancia i18n por props y se ajustan a mano.
 */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { collectFindings, type Finding } from "./i18n-scan.js";

const ROOT = path.resolve(import.meta.dir, "..");
const YES = process.argv.includes("--yes");
const DRY = process.argv.includes("--dry");

type Accepted = { finding: Finding; key: string; propName: string };

const camel = (lastSegment: string): string => {
  const clean = lastSegment.replace(/[^$\w]/g, "");
  return clean.charAt(0).toLowerCase() + clean.slice(1);
};

/** Nombre de la propiedad TEXTS a partir de la llave, sin colisiones. */
const propNameFor = (key: string, taken: Set<string>): string => {
  const segments = key.split(".");
  let base = camel(segments[segments.length - 1]) || "text";
  let name = base;
  let n = 2;
  while (taken.has(name)) name = `${base}${n++}`;
  taken.add(name);
  return name;
};

/** Llama del reemplazo: t/raw(TEXTS.x.key, [params], TEXTS.x.default). */
function callText(mode: "t" | "raw", prop: string, finding: Finding): string {
  const params = finding.params;
  if (params.length === 0) {
    return `${mode}(TEXTS.${prop}.key, undefined, TEXTS.${prop}.default)`;
  }
  const entries = params.map((p) =>
    p.name === p.valueText ? p.name : `${p.name}: ${p.valueText}`,
  );
  return `${mode}(TEXTS.${prop}.key, { ${entries.join(", ")} }, TEXTS.${prop}.default)`;
}

/** Declaración TEXTS existente en el archivo (o null). */
function findTextsDeclaration(source: ts.SourceFile) {
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    const decl = statement.declarationList.declarations[0];
    if (decl && ts.isIdentifier(decl.name) && decl.name.text === "TEXTS" && decl.initializer && ts.isObjectLiteralExpression(decl.initializer)) {
      return { node: decl, object: decl.initializer, statementEnd: statement.getEnd() };
    }
  }
  return null;
}

function lastImportEnd(source: ts.SourceFile): number {
  let end = 0;
  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement)) end = Math.max(end, statement.getEnd());
  }
  return end;
}

/** Aplica a un archivo todas las sustituciones aceptadas. */
function applyToFile(relFile: string, accepted: Accepted[]): void {
  const abs = path.join(ROOT, relFile);
  const original = fs.readFileSync(abs, "utf8");
  const source = ts.createSourceFile(abs, original, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  type Edit = { start: number; end: number; text: string };
  const edits: Edit[] = [];
  const needs = new Set<"t" | "raw">();
  const takenProps = new Set<string>();

  // Entradas nuevas para el TEXTS (o el que se cree).
  const newEntries: Array<{ prop: string; key: string; finding: Finding }> = [];
  for (const { finding, key, propName } of accepted) {
    needs.add(finding.mode);
    takenProps.add(propName);
    newEntries.push({ prop: propName, key, finding });
    edits.push({
      start: finding.start,
      end: finding.end,
      text: callText(finding.mode, propName, finding),
    });
  }

  // Import de "vanui": completar llaves existentes o crear la declaración.
  const vanuiImport = source.statements.find(
    (s): s is ts.ImportDeclaration =>
      ts.isImportDeclaration(s) && s.moduleSpecifier.getText(source).replace(/['"]/g, "") === "vanui",
  );
  if (vanuiImport?.importClause?.namedBindings && ts.isNamedImports(vanuiImport.importClause.namedBindings)) {
    const existing = new Set(vanuiImport.importClause.namedBindings.elements.map((e) => e.name.text));
    const missing = [...needs].filter((n) => !existing.has(n));
    if (missing.length > 0) {
      const bindings = vanuiImport.importClause.namedBindings;
      // Insertar tras la primera llave: { t, ...resto } mantiene el orden legible.
      const insertAt = bindings.getStart(source) + 1;
      edits.push({ start: insertAt, end: insertAt, text: `${missing.join(", ")},` });
    }
  } else {
    const names = [...needs].join(", ");
    const at = lastImportEnd(source);
    edits.push({ start: at, end: at, text: `\nimport { ${names} } from "vanui";` });
  }

  // TEXTS: insertar entradas en el objeto existente o crear la declaración.
  const texts = findTextsDeclaration(source);
  if (texts) {
    const indentMatch = original.slice(texts.object.getStart(source) + 1).match(/\n([ \t]*)\w/);
    const indent = indentMatch ? indentMatch[1] : "  ";
    const block = newEntries
      .map(({ prop, key, finding }) => `${indent}${prop}: { key: "${key}", default: ${JSON.stringify(finding.text)} },`)
      .join("\n");
    edits.push({ start: texts.object.getStart(source) + 1, end: texts.object.getStart(source) + 1, text: `\n${block}` });
  } else {
    const block =
      `\n/** Contrato de llaves de i18n (entradas generadas por i18n:fix). */\n` +
      `export const TEXTS = {\n` +
      newEntries.map(({ prop, key, finding }) => `  ${prop}: { key: "${key}", default: ${JSON.stringify(finding.text)} },`).join("\n") +
      `\n} as const;\n`;
    edits.push({ start: lastImportEnd(source), end: lastImportEnd(source), text: `${block}` });
  }

  // Aplicar de atrás hacia adelante para no invalidar posiciones.
  edits.sort((a, b) => b.start - a.start);
  let result = original;
  for (const edit of edits) {
    result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
  }
  fs.writeFileSync(abs, result);
}

// ── Flujo principal ─────────────────────────────────────────────────────────
const findings = collectFindings().filter((f) => f.confidence === "ALTA" && f.file.startsWith("demo/"));

if (findings.length === 0) {
  console.log("i18n:fix — no hay textos ALTA pendientes en demo/. Nada que hacer.");
  process.exit(0);
}

if (!YES && !DRY && !process.stdin.isTTY) {
  console.error("stdin no interactivo: usa --yes (aceptar todo) o --dry (solo plan).");
  process.exit(1);
}

console.log(`i18n:fix — ${findings.length} candidatos en demo/\n`);

const plan = new Map<string, Accepted[]>();
let quit = false;

for (const finding of findings) {
  let key = finding.suggestedKey;
  let apply = YES;

  if (!YES) {
    console.log(`${finding.file}:${finding.line}  "${finding.text}"`);
    console.log(`  modo: ${finding.mode}${finding.params.length ? ` (params: ${finding.params.map((p) => `{${p.name}}`).join(", ")})` : ""}`);
    console.log(`  llave propuesta: ${key}`);
    const answer = prompt("  ¿aplicar? [s/n/e(ditar llave)/a(cepta todas)/q(uitar)] ");
    const option = (answer ?? "n").trim().toLowerCase();
    if (option === "q") { quit = true; break; }
    if (option === "a") { apply = true; }
    else if (option === "e") {
      const custom = prompt(`  llave [${key}]: `);
      key = (custom ?? "").trim() || key;
      apply = true;
    } else {
      apply = option === "s";
    }
  }

  if (!apply) continue;
  const list = plan.get(finding.file) ?? [];
  list.push({ finding, key, propName: "" });
  plan.set(finding.file, list);
}

if (quit) console.log("\nInterrumpido: los cambios ya aceptados se aplican igual.");

// Resolver nombres de propiedad por archivo (evita colisiones).
for (const [file, list] of plan) {
  const existing = new Set<string>();
  const abs = path.join(ROOT, file);
  if (fs.existsSync(abs)) {
    const source = ts.createSourceFile(abs, fs.readFileSync(abs, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const texts = findTextsDeclaration(source);
    if (texts) {
      for (const prop of texts.object.properties) {
        if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) existing.add(prop.name.text);
      }
    }
  }
  for (const item of list) item.propName = propNameFor(item.key.split(".").pop() ?? "text", existing);
}

// Plan (dry) o escritura.
let total = 0;
for (const [file, list] of plan) {
  console.log(`\n${file}:`);
  for (const { finding, key, propName } of list) {
    console.log(`  ${propName}: { key: "${key}", default: "${finding.text}" }`);
    console.log(`    → ${callText(finding.mode, propName, finding)}`);
  }
  total += list.length;
  if (!DRY) applyToFile(file, list);
}

console.log(`\n${DRY ? "Plan (dry):" : "Aplicado:"} ${total} sustituciones en ${plan.size} archivo(s).`);

if (!DRY && total > 0) {
  console.log("\nRegenerando diccionarios (i18n:collect)...");
  const proc = Bun.spawnSync(["bun", path.join(ROOT, "scripts", "i18n-collect.ts")], { cwd: ROOT, stdout: "inherit", stderr: "inherit" });
  if (proc.exitCode !== 0) {
    console.error("i18n:collect falló — revisa los conflictos arriba.");
    process.exit(proc.exitCode ?? 1);
  }
  console.log('Siguiente paso: bun run i18n:check para ver los huecos de traducción en en/fr.');
}
