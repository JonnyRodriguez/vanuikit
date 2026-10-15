/**
 * i18n-scan — detector de strings de UI sin internacionalizar.
 *
 * Recorre demo/** y vanui/src/** con el compilador de TypeScript y reporta
 * literales de string (y template literals) que probablemente son texto
 * visible, por POSICIÓN estructural — nunca por contenido:
 *
 *   ALTA   — hijo directo de un componente/empleado conocido (Button, toast.*,
 *            van.tags.*, ...) o valor de una prop semántica (label, title,
 *            placeholder, message, aria-label, ...).
 *   MEDIA  — argumento string de primer nivel en una llamada desconocida que
 *            no esté excluida (componentes locales, posibles falsos positivos).
 *
 * Exclusiones por diseño: props técnicas (class, type, id, href, icon, ...),
 * el contrato TEXTS ({ key, default }), llamadas no-texto (cx, i18n, t, raw,
 * navigate, ...), import/export, nodos de tipos, rutas, marcas, emojis y
 * templates cuyas partes literales no llevan palabras (datos, no texto).
 *
 * Modos:
 *   bun scripts/i18n-scan.ts           → reporta hallazgos
 *   bun scripts/i18n-scan.ts --check   → exit 1 si hay hallazgos de nivel ALTA
 *
 * `collectFindings()` se exporta para el codemod `i18n-fix.ts`.
 */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = path.resolve(import.meta.dir, "..");
const SCAN_PATTERNS = ["demo/**/*.ts", "vanui/src/**/*.ts"];
const EXCLUDE = [
  /(^|\/)dist\//,
  /(^|\/)node_modules\//,
  /\.test\.ts$/,
  /(^|\/)fixtures\//,
  /(^|\/)locales\//,
  /(^|\/)server\//,
  /(^|\/)i18n\.ts$/,
  /(^|\/)i18n\.config\.ts$/,
];

/** Callees que reciben texto visible como argumento directo. */
const TEXT_CALLEES = new Set([
  "Button", "PrimaryButton", "SecondaryButton", "Badge", "Tabs", "Sidebar",
  "SidebarGroup", "SidebarItem", "HeaderBar", "Spin", "Link", "Nav",
  "DataGrid", "SelectDropdown", "DropdownMenu", "ModalBase", "ConfirmDialog",
  "UserBadge", "ThemeToggle", "LocaleSelector", "Field",
  "TextField", "EmailField", "PasswordField", "Form", "Modal", "SpinModal",
  // Tags destructurados de van.tags (const { span } = van.tags).
  "div", "span", "a", "p", "h1", "h2", "h3", "h4", "h5", "h6", "button",
  "label", "strong", "em", "small", "li", "td", "th", "section", "header",
]);

/** Props semánticas de texto (en cualquier objeto literal). */
const TEXT_PROPS = new Set([
  "label", "title", "placeholder", "text", "message", "description",
  "subtitle", "header", "confirmText", "cancelText", "searchPlaceholder",
  "emptyText", "aria-label", "alt", "tooltip",
]);

/** Props técnicas: su valor nunca es texto visible. */
const IGNORE_PROPS = new Set([
  "key", "default", "class", "className", "type", "id", "href", "value",
  "mode", "variant", "code", "icon", "flag", "storageKey", "name", "role",
  "labelKey", "titleKey", "is", "badgeVariant", "align", "target", "rel",
]);

/** Callees técnicos cuyos argumentos nunca son texto visible. */
const IGNORE_CALLEES = new Set([
  "cx", "navigate", "spaClick", "createRouter", "createAuth", "requireAuth",
  "loadRoutes", "fetch", "i18n", "t", "raw",
]);

/** Métodos estándar cuyo argumento string nunca es texto visible. */
const IGNORE_MEMBERS = new Set([
  "add", "startsWith", "endsWith", "includes", "push", "getItem", "setItem",
  "removeItem", "split", "replace", "replaceAll", "concat", "slice",
  "toFixed", "querySelector", "querySelectorAll", "getElementById",
  "closest", "addEventListener", "removeEventListener", "scrollTo", "log",
  "warn", "error", "open", "get", "state", "derive",
]);

/** Marcas y nombres propios que no se traducen. */
const BRANDS = new Set(["VanUI", "VanJS", "VanJS core", "React", "Vue", "Svelte"]);

export type Confidence = "ALTA" | "MEDIA";
export type I18nMode = "t" | "raw";
export type TemplateParam = { name: string; valueText: string };

export type Finding = {
  confidence: Confidence;
  /** t = slot reactivo (hijo/prop); raw = consumo imperativo (toast, confirmDialog). */
  mode: I18nMode;
  file: string;
  line: number;
  text: string;
  suggestedKey: string;
  context: string;
  /** Posiciones del literal en el archivo original (para el codemod). */
  start: number;
  end: number;
  prop?: string;
  /** Parámetros del template interpolado: `Hola ${name}` → [{ name: "name", ... }]. */
  params: TemplateParam[];
};

const hasLetters = (s: string): boolean => /\p{L}{2,}/u.test(s);
const isEmojiish = (s: string): boolean =>
  !hasLetters(s) || /^\p{Extended_Pictographic}|\p{Extended_Pictographic}$/u.test(s.trim());
const isPath = (s: string): boolean => /^\/[\w\-./]*$/.test(s);

function slugFile(relFile: string): string {
  const base = path.basename(relFile).replace(/\.(page|component|ts|js)/g, "").replace(/\.+$/, "");
  const [first, ...rest] = base.split("-");
  return [first, ...rest.map((p) => p[0]?.toUpperCase() + p.slice(1))].join("");
}

const paramName = (expr: ts.Expression): string => {
  if (ts.isIdentifier(expr)) return expr.text;
  if (ts.isPropertyAccessExpression(expr)) return expr.name.text;
  return expr.getText().replace(/[^$\w]/g, "").slice(0, 12) || "valor";
};

export function collectFindings(): Finding[] {
  const findings: Finding[] = [];

  for (const pattern of SCAN_PATTERNS) {
    const glob = new Bun.Glob(pattern);
    for (const relFile of glob.scanSync({ cwd: ROOT })) {
      if (EXCLUDE.some((re) => re.test(relFile))) continue;
      scanFile(relFile, findings);
    }
  }

  findings.sort((a, b) => (a.file === b.file ? a.line - b.line : a.file.localeCompare(b.file)));
  return findings;
}

function scanFile(relFile: string, findings: Finding[]): void {
  const abs = path.join(ROOT, relFile);
  const source = ts.createSourceFile(abs, fs.readFileSync(abs, "utf8"), ts.ScriptTarget.Latest, /* setParentNodes */ true, ts.ScriptKind.TS);
  const slug = slugFile(relFile);
  const suggested = new Map<string, number>();

  const nextKey = (prop?: string): string => {
    const base = `${slug}.${prop ?? "text"}`;
    const n = (suggested.get(base) ?? 0) + 1;
    suggested.set(base, n);
    return n === 1 ? base : `${base}${n}`;
  };

  const record = (
    confidence: Confidence,
    node: ts.Node & { text?: string },
    opts: { prop?: string; context?: string; mode: I18nMode },
  ): void => {
    const raw = ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)
      ? node.text
      : node.getText(source);
    if (!raw || !hasLetters(raw) || isEmojiish(raw) || isPath(raw) || BRANDS.has(raw)) return;

    let text = raw;
    const params: TemplateParam[] = [];
    if (ts.isTemplateExpression(node)) {
      const parts = [node.head.text];
      for (const span of node.templateSpans) {
        const name = paramName(span.expression);
        parts.push(`{${name}}`, span.literal.text);
        if (!params.some((p) => p.name === name)) {
          params.push({ name, valueText: span.expression.getText(source) });
        }
      }
      text = parts.join("");
    }

    const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
    findings.push({
      confidence,
      mode: opts.mode,
      file: relFile,
      line: line + 1,
      text: text.length > 80 ? `${text.slice(0, 77)}...` : text,
      suggestedKey: nextKey(opts.prop),
      context: (opts.context ?? "").replace(/\s+/g, " ").slice(0, 90),
      start: node.getStart(source),
      end: node.getEnd(),
      prop: opts.prop,
      params,
    });
  };

  const isText = (node: ts.Node): boolean => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return true;
    // Un template es texto si alguna parte literal lleva letras; `${a} - ${b}` es datos.
    if (ts.isTemplateExpression(node)) {
      const literals = [node.head.text, ...node.templateSpans.map((s) => s.literal.text)];
      return literals.some((part) => /\p{L}{2,}/u.test(part));
    }
    return false;
  };

  const calleeName = (expr: ts.Expression): { name: string; member?: string } | null => {
    if (ts.isIdentifier(expr)) return { name: expr.text };
    if (ts.isPropertyAccessExpression(expr)) {
      return { name: expr.expression.getText(source), member: expr.name.text };
    }
    return null;
  };

  const visit = (node: ts.Node, rawCtx: boolean): void => {
    // Zonas que nunca contienen texto de UI: declaraciones y nodos de tipo.
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node) || ts.isTypeNode(node)) return;

    if (ts.isCallExpression(node)) {
      // import("modulo"): el argumento es un specifier, nunca texto.
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) return;
      const callee = calleeName(node.expression);
      const name = callee?.name ?? "";
      const member = callee?.member;

      // Llamadas técnicas: no revisar sus argumentos directos, pero sí bajar
      // (un arrow dentro puede contener llamadas a componentes).
      if (
        IGNORE_CALLEES.has(name) ||
        (member !== undefined && IGNORE_MEMBERS.has(member)) ||
        name === "van.derive" ||
        name === "van.state" ||
        name === "cx" ||
        name.startsWith("console.") ||
        name.startsWith("window.") ||
        name.startsWith("document.")
      ) {
        node.arguments.forEach((arg) => visit(arg, rawCtx));
        ts.forEachChild(node, (child) => { if (!node.arguments.includes(child)) visit(child, rawCtx); });
        return;
      }

      // Emisores imperativos: lo que reciben se consume al instante → raw.
      if (name === "toast" || name === "confirmDialog") {
        for (const arg of node.arguments) {
          if (ts.isObjectLiteralExpression(arg)) visit(arg, true);
          else if (isText(arg)) record("ALTA", arg, { mode: "raw", context: node.getText(source) });
          else visit(arg, true);
        }
        ts.forEachChild(node, (child) => { if (!node.arguments.includes(child)) visit(child, rawCtx); });
        return;
      }

      // Componentes/tags: hijos y props de primer nivel son ALTA.
      if (TEXT_CALLEES.has(name) || name === "van.tags") {
        for (const arg of node.arguments) {
          if (ts.isObjectLiteralExpression(arg)) visit(arg, rawCtx);
          else if (isText(arg)) record("ALTA", arg, { mode: rawCtx ? "raw" : "t", context: node.getText(source) });
          else visit(arg, rawCtx);
        }
        ts.forEachChild(node, (child) => { if (!node.arguments.includes(child)) visit(child, rawCtx); });
        return;
      }

      // Llamada desconocida: strings sueltos de primer nivel son MEDIA.
      for (const arg of node.arguments) {
        if (isText(arg)) record("MEDIA", arg, { mode: "raw", context: node.getText(source) });
        else visit(arg, rawCtx);
      }
      ts.forEachChild(node, (child) => { if (!node.arguments.includes(child)) visit(child, rawCtx); });
      return;
    }

    if (ts.isObjectLiteralExpression(node)) {
      const hasTextsShape = node.properties.some(
        (p) => ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && (p.name.text === "key" || p.name.text === "default") && ts.isStringLiteral(p.initializer),
      );
      for (const prop of node.properties) {
        if (!ts.isPropertyAssignment(prop)) {
          visit(prop, rawCtx);
          continue;
        }
        const propName = ts.isIdentifier(prop.name) ? prop.name.text : (ts.isStringLiteral(prop.name) ? prop.name.text : undefined);
        // Contrato TEXTS: sus valores son defaults, no texto suelto.
        if (hasTextsShape && (propName === "key" || propName === "default")) continue;
        if (propName && TEXT_PROPS.has(propName) && isText(prop.initializer)) {
          record("ALTA", prop.initializer, { prop: propName, mode: rawCtx ? "raw" : "t", context: prop.getText(source) });
        } else if (propName && IGNORE_PROPS.has(propName)) {
          continue;
        } else {
          visit(prop.initializer, rawCtx);
        }
      }
      return;
    }

    ts.forEachChild(node, (child) => visit(child, rawCtx));
  };

  visit(source, false);
}

if (import.meta.main) {
  const findings = collectFindings();
  const high = findings.filter((f) => f.confidence === "ALTA");
  const medium = findings.filter((f) => f.confidence === "MEDIA");
  const CHECK = process.argv.includes("--check");

  const print = (title: string, group: Finding[]): void => {
    console.log(`\n${title} (${group.length}):`);
    for (const f of group) {
      console.log(`  ${f.file}:${f.line}  "${f.text}"`);
      console.log(`    llave sugerida: ${f.suggestedKey}`);
      if (f.context) console.log(`    > ${f.context}`);
    }
  };

  print("ALTA — texto de UI sin internacionalizar", high);
  print("MEDIA — revisar (llamada desconocida)", medium);
  console.log(`\nTotal: ${high.length} altas, ${medium.length} medias`);

  if (CHECK && high.length > 0) {
    console.error(`i18n:scan FALLÓ (${high.length} textos ALTA sin internacionalizar)`);
    process.exit(1);
  }
}
