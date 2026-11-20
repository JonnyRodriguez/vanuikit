/**
 * i18n-fix — assisted codemod that converts UI strings detected by
 * `i18n-scan` into inline `t()`/`raw()` calls with a semantic key.
 *
 * For each HIGH finding in demo/**: it proposes a key (editable), completes the
 * import of `t`/`raw` from "vanuikit" and replaces the literal with
 * `t("key", "text")` (or `raw(...)` in imperative context; interpolated
 * templates are converted into `{ name }` parameters). When finished it runs
 * `i18n:collect` to regenerate es.json; the gaps in es/fr are reported by
 * `i18n:check`.
 *
 * Modes:
 *   bun scripts/i18n-fix.ts            → interactive (confirms key by key)
 *   bun scripts/i18n-fix.ts --yes      → accepts all proposals
 *   bun scripts/i18n-fix.ts --dry      → shows the plan without writing
 *
 * Files under vanuikit/src are deliberately excluded: their components follow the
 * per-props i18n instance pattern and are adjusted by hand.
 */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { collectFindings, type Finding } from "./i18n-scan.js";

const ROOT = path.resolve(import.meta.dir, "..");
const YES = process.argv.includes("--yes");
const DRY = process.argv.includes("--dry");

type Accepted = { finding: Finding; key: string };

/** Replacement call: t/raw("key", "default" [, params]). */
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

  // Import from "vanuikit": complete existing bindings or create the declaration.
  const vanuikitImport = source.statements.find(
    (s): s is ts.ImportDeclaration =>
      ts.isImportDeclaration(s) && s.moduleSpecifier.getText(source).replace(/['"]/g, "") === "vanuikit",
  );
  if (vanuikitImport?.importClause?.namedBindings && ts.isNamedImports(vanuikitImport.importClause.namedBindings)) {
    const existing = new Set(vanuikitImport.importClause.namedBindings.elements.map((e) => e.name.text));
    const missing = [...needs].filter((n) => !existing.has(n));
    if (missing.length > 0) {
      const bindings = vanuikitImport.importClause.namedBindings;
      // Insert after the first binding: { t, ...rest } keeps the order readable.
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

  // Apply back-to-front so positions aren't invalidated.
  edits.sort((a, b) => b.start - a.start);
  let result = original;
  for (const edit of edits) {
    result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
  }
  fs.writeFileSync(abs, result);
}

// ── Main flow ──────────────────────────────────────────────────────────────
const findings = collectFindings().filter((f) => f.confidence === "HIGH" && f.file.startsWith("demo/"));

if (findings.length === 0) {
  console.log("i18n:fix — no pending HIGH texts in demo/. Nothing to do.");
  process.exit(0);
}

if (!YES && !DRY && !process.stdin.isTTY) {
  console.error("stdin is not interactive: use --yes (accept all) or --dry (plan only).");
  process.exit(1);
}

console.log(`i18n:fix — ${findings.length} candidates in demo/\n`);

const plan = new Map<string, Accepted[]>();
let quit = false;

for (const finding of findings) {
  let key = finding.suggestedKey;
  let apply = YES;

  if (!YES) {
    console.log(`${finding.file}:${finding.line}  "${finding.text}"`);
    console.log(`  modo: ${finding.mode}${finding.params.length ? ` (params: ${finding.params.map((p) => `{${p.name}}`).join(", ")})` : ""}`);
    console.log(`  proposed key: ${key}`);
    const answer = prompt("  apply? [y/n/e(edit key)/a(accept all)/q(uit)] ");
    const option = (answer ?? "n").trim().toLowerCase();
    if (option === "q") { quit = true; break; }
    if (option === "a") { apply = true; }
    else if (option === "e") {
      const custom = prompt(`  key [${key}]: `);
      key = (custom ?? "").trim() || key;
      apply = true;
    } else {
      apply = option === "y";
    }
  }

  if (!apply) continue;
  const list = plan.get(finding.file) ?? [];
  list.push({ finding, key });
  plan.set(finding.file, list);
}

if (quit) console.log("\nInterrupted: already-accepted changes are applied anyway.");

let total = 0;
for (const [file, list] of plan) {
  console.log(`\n${file}:`);
  for (const { finding, key } of list) {
    console.log(`  ${key} → ${callText(finding.mode, key, finding)}`);
  }
  total += list.length;
  if (!DRY) applyToFile(file, list);
}

console.log(`\n${DRY ? "Plan (dry):" : "Applied:"} ${total} substitutions in ${plan.size} file(s).`);

if (!DRY && total > 0) {
  console.log("\nRegenerating dictionaries (i18n:collect)...");
  const proc = Bun.spawnSync(["bun", path.join(ROOT, "scripts", "i18n-collect.ts")], { cwd: ROOT, stdout: "inherit", stderr: "inherit" });
  if (proc.exitCode !== 0) {
    console.error("i18n:collect failed — review the conflicts above.");
    process.exit(proc.exitCode ?? 1);
  }
  console.log('Next step: bun run i18n:check to see translation gaps in es/fr.');
}
