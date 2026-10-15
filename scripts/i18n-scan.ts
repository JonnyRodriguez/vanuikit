/**
 * i18n-scan — detector de strings de UI sin internacionalizar (solo lectura).
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
 * el contrato TEXTS ({ key, default }), llamadas no-texto (cx, van.derive,
 * navigate, ...), import/export, nodos de tipos, emojis y strings sin letras.
 *
 * Modos:
 *   bun scripts/i18n-scan.ts           → reporta hallazgos
 *   bun scripts/i18n-scan.ts --check   → exit 1 si hay hallazgos de nivel ALTA
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
  "confirmDialog", "UserBadge", "ThemeToggle", "LocaleSelector", "Field",
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

const CHECK = process.argv.includes("--check");

type Confidence = "ALTA" | "MEDIA";
type Finding = { confidence: Confidence; file: string; line: number; text: string; suggestedKey: string; context: string };

const hasLetters = (s: string): boolean => /\p{L}{2,}/u.test(s);
const isEmojiish = (s: string): boolean =>
  !hasLetters(s) || /^\p{Extended_Pictographic}|\p{Extended_Pictographic}$/u.test(s.trim());
const isPath = (s: string): boolean => /^\/[\w\-./]*$/.test(s);

function slugFile(relFile: string): string {
  const base = path.basename(relFile).replace(/\.(page|component|ts|js)/g, "").replace(/\.+$/, "");
  const [first, ...rest] = base.split("-");
  return [first, ...rest.map((p) => p[0]?.toUpperCase() + p.slice(1))].join("");
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

  const record = (confidence: Confidence, node: ts.Node, prop?: string, context = ""): void => {
    const raw = ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)
      ? node.text
      : node.getText(source);
    if (!raw || !hasLetters(raw) || isEmojiish(raw) || isPath(raw) || BRANDS.has(raw)) return;
    const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
    findings.push({
      confidence,
      file: relFile,
      line: line + 1,
      text: raw.length > 80 ? `${raw.slice(0, 77)}...` : raw,
      suggestedKey: nextKey(prop),
      context: context.replace(/\s+/g, " ").slice(0, 90),
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

  const visit = (node: ts.Node): void => {
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
        node.arguments.forEach(visit);
        ts.forEachChild(node, (child) => { if (!node.arguments.includes(child)) visit(child); });
        return;
      }

      // Componentes/emisores de texto: hijos y props de primer nivel son ALTA.
      const isTextCallee = TEXT_CALLEES.has(name) || name === "van.tags" || name === "toast";
      if (isTextCallee) {
        for (const arg of node.arguments) {
          if (ts.isObjectLiteralExpression(arg)) {
            visit(arg);
          } else if (isText(arg)) {
            record("ALTA", arg, undefined, node.getText(source));
          } else {
            visit(arg);
          }
        }
        ts.forEachChild(node, (child) => { if (!node.arguments.includes(child)) visit(child); });
        return;
      }

      // Llamada desconocida: strings sueltos de primer nivel son MEDIA.
      for (const arg of node.arguments) {
        if (isText(arg)) record("MEDIA", arg, undefined, node.getText(source));
        else visit(arg);
      }
      ts.forEachChild(node, (child) => { if (!node.arguments.includes(child)) visit(child); });
      return;
    }

    if (ts.isObjectLiteralExpression(node)) {
      const props = node.properties;
      const hasTextsShape = props.some(
        (p) => ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && (p.name.text === "key" || p.name.text === "default") && ts.isStringLiteral(p.initializer),
      );
      for (const prop of props) {
        if (!ts.isPropertyAssignment(prop) && !ts.isShorthandPropertyAssignment(prop)) {
          visit(prop);
          continue;
        }
        if (!ts.isPropertyAssignment(prop)) continue;
        const propName = ts.isIdentifier(prop.name) ? prop.name.text : (ts.isStringLiteral(prop.name) ? prop.name.text : undefined);
        // Contrato TEXTS: sus valores son defaults, no texto suelto.
        if (hasTextsShape && (propName === "key" || propName === "default")) continue;
        if (propName && TEXT_PROPS.has(propName) && isText(prop.initializer)) {
          record("ALTA", prop.initializer, propName, prop.getText(source));
        } else if (propName && IGNORE_PROPS.has(propName)) {
          continue;
        } else {
          visit(prop.initializer);
        }
      }
      return;
    }

    ts.forEachChild(node, visit);
  };

  visit(source);
}

const findings: Finding[] = [];
for (const pattern of SCAN_PATTERNS) {
  const glob = new Bun.Glob(pattern);
  for (const rel of glob.scanSync({ cwd: ROOT })) {
    if (EXCLUDE.some((re) => re.test(rel))) continue;
    scanFile(rel, findings);
  }
}

findings.sort((a, b) => (a.file === b.file ? a.line - b.line : a.file.localeCompare(b.file)));
const high = findings.filter((f) => f.confidence === "ALTA");
const medium = findings.filter((f) => f.confidence === "MEDIA");

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
