/**
 * i18n-fix — codemod asistido que convierte strings de UI detectados por
 * `i18n-scan` en llamadas `t()`/`raw()` inline con llave semántica.
 *
 * Por cada hallazgo ALTA en demo/**: propone una llave (editable), completa el
 * import de `t`/`raw` desde "vanuikit" y reemplaza el literal por
 * `t("llave", "texto")` (o `raw(...)` en contexto imperativo; los templates
 * interpolados se convierten en parámetros `{ nombre }`). Al terminar ejecuta
 * `i18n:collect` para regenerar es.json; los huecos en/fr los reporta
 * `i18n:check`.
 *
 * Modos:
 *   bun scripts/i18n-fix.ts            → interactivo (confirma llave por llave)
 *   bun scripts/i18n-fix.ts --yes      → acepta todas las propuestas
 *   bun scripts/i18n-fix.ts --dry      → muestra el plan sin escribir
 *
 * Los archivos de vanuikit/src se excluyen a propósito: sus componentes siguen el
 * patrón de instancia i18n por props y se ajustan a mano.
 */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { collectFindings, type Finding } from "./i18n-scan.js";

const ROOT = path.resolve(import.meta.dir, "..");
const YES = process.argv.includes("--yes");
const DRY = process.argv.includes("--dry");

type Accepted = { finding: Finding; key: string };

/** Llamada del reemplazo: t/raw("llave", "default" [, params]). */
function callText(mode: "t" | "raw", key: string, finding: Finding): string {
  const params = finding.params;
  if (params.length === 0) return `${mode}(${JSON.stringify(key)}, ${JSON.stringify(finding.text)})`;
  const entries = params.map((p) =>
    p.name === p.valueText ? p.name : `${p.name}: ${p.valueText}`,
  );
  return `${mode}(${JSON.stringify(key)}, ${JSON.stringify(finding.text)}, { ${entries.join(", ")} })`;
}

function applyToFile(relFile: string, accepted: Accepted[]): void {
  const abs = path.join(ROOT, relFile);
  const original = fs.readFileSync(abs, "utf8");
  const source = ts.createSourceFile(abs, original, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  const edits: Array<{ start: number; end: number; text: string }> = [];
  const needs = new Set<"t" | "raw">();

  for (const { finding, key } of accepted) {
    needs.add(finding.mode);
    edits.push({
      start: finding.start,
      end: finding.end,
      text: callText(finding.mode, key, finding),
    });
  }

  // Import de "vanuikit": completar llaves existentes o crear la declaración.
  const vanuikitImport = source.statements.find(
    (s): s is ts.ImportDeclaration =>
      ts.isImportDeclaration(s) && s.moduleSpecifier.getText(source).replace(/['"]/g, "") === "vanuikit",
  );
  if (vanuikitImport?.importClause?.namedBindings && ts.isNamedImports(vanuikitImport.importClause.namedBindings)) {
    const existing = new Set(vanuikitImport.importClause.namedBindings.elements.map((e) => e.name.text));
    const missing = [...needs].filter((n) => !existing.has(n));
    if (missing.length > 0) {
      const bindings = vanuikitImport.importClause.namedBindings;
      // Insertar tras la primera llave: { t, ...resto } mantiene el orden legible.
      const insertAt = bindings.getStart(source) + 1;
      edits.push({ start: insertAt, end: insertAt, text: `${missing.join(", ")},` });
    }
  } else {
    const names = [...needs].join(", ");
    let lastImportEnd = 0;
    for (const s of source.statements) {
      if (ts.isImportDeclaration(s)) lastImportEnd = Math.max(lastImportEnd, s.getEnd());
    }
    edits.push({ start: lastImportEnd, end: lastImportEnd, text: `\nimport { ${names} } from "vanuikit";` });
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
  list.push({ finding, key });
  plan.set(finding.file, list);
}

if (quit) console.log("\nInterrumpido: los cambios ya aceptados se aplican igual.");

let total = 0;
for (const [file, list] of plan) {
  console.log(`\n${file}:`);
  for (const { finding, key } of list) {
    console.log(`  ${key} → ${callText(finding.mode, key, finding)}`);
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
