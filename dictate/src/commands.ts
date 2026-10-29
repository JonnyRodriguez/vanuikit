/**
 * Nivel 2: comandos por voz.
 *
 * El texto transcrito (STT) se envía a un modelo de completación ligero
 * (Gemini 3.5-flash-lite, REST, no-live) que CLASIFICA si es un comando o
 * dictado puro. Si es comando, devuelve un JSON estructurado con la acción
 * y sus parámetros; si no, devuelve el texto a pegar.
 *
 * Este módulo es PURO: no sabe ejecutar nada. La ejecución se inyecta vía
 * el objeto `deps` (para no acoplar con el CLI y ser testeable/aislado).
 */

// Verificado en la cuenta (2026-10): gemini-3.5-flash-lite responde estable.
// Los demás modelos de Google tienen cupos muy bajos (503 por alta demanda).
const DEFAULT_CMD_MODEL = "models/gemini-3.5-flash-lite";

export interface CommandDeps {
  /** Enfoca la ventana de Zed y devuelve true si lo logró. */
  focusZed: () => boolean;
  /** Inyecta una secuencia de teclas (p. ej. "ctrl+s"). Devuelve si se envió. */
  sendKeys: (combo: string) => boolean;
  /** Notificación de escritorio. */
  notify: (title: string, body: string) => void;
  /** Log hacia consola. */
  log: (msg: string) => void;
}

/** Definición de una acción de comando. */
export interface CommandAction {
  name: string;
  description: string;
  /** Teclas a inyectar en Zed (p. ej. "ctrl+s"). */
  combo: string;
  /** Si true, no inyecta teclas (solo notifica / efecto lógico). */
  noop?: boolean;
}

export const ACTIONS: Record<string, CommandAction> = {
  save: { name: "save", description: "Guardar el archivo activo (Ctrl+S)", combo: "ctrl+s" },
  undo: { name: "undo", description: "Deshacer la última acción (Ctrl+Z)", combo: "ctrl+z" },
  redo: { name: "redo", description: "Rehacer (Ctrl+Shift+Z)", combo: "ctrl+shift+z" },
  newline: { name: "newline", description: "Insertar una nueva línea (Enter)", combo: "enter" },
  close_tab: { name: "close_tab", description: "Cerrar la pestaña/archivo activo (Ctrl+W)", combo: "ctrl+w" },
  next_tab: { name: "next_tab", description: "Ir a la siguiente pestaña (Ctrl+Tab)", combo: "ctrl+tab" },
  prev_tab: { name: "prev_tab", description: "Ir a la pestaña anterior (Ctrl+Shift+Tab)", combo: "ctrl+shift+tab" },
  select_all: { name: "select_all", description: "Seleccionar todo (Ctrl+A)", combo: "ctrl+a" },
  copy: { name: "copy", description: "Copiar selección (Ctrl+C)", combo: "ctrl+c" },
  cut: { name: "cut", description: "Cortar selección (Ctrl+X)", combo: "ctrl+x" },
  paste: { name: "paste", description: "Pegar el portapapeles (Ctrl+V)", combo: "ctrl+v" },
  find: { name: "find", description: "Buscar en el archivo (Ctrl+F)", combo: "ctrl+f" },
  cancel: {
    name: "cancel",
    description: "Cancelar el dictado actual (dejar de escuchar)",
    combo: "",
    noop: true,
  },
};

/** Resultado de la clasificación. */
export type Interpretation =
  | { kind: "command"; action: string; args: Record<string, unknown> }
  | { kind: "dictation"; text: string };

function systemPrompt(): string {
  const list = Object.values(ACTIONS)
    .map((a) => `  - ${a.name}: ${a.description}`)
    .join("\n");
  return `Eres un intérprete de comandos de voz para un editor de código (Zed).
El usuario dicta algo. Debes clasificar si es UN COMANDO de edición o TEXT O a pegar (dictado normal).

Comandos disponibles:
${list}

Reglas:
- Si lo dicho coincide claramente con uno de los comandos (directamente o con sinónimos naturales), devuelve un objeto con "kind":"command", "action":"<nombre>".
- Si NO es un comando claro (es texto a escribir en el código, oración, pseudocódigo, un nombre de variable, comentario, etc.), devuelve {"kind":"dictation","text":"<el texto literal, limpio>"}.
- En caso de duda, SIEMPRE devuelve dictation. Es mejor pegar texto que ejecutar un comando equivocado.
- No inventes acciones que no estén en la lista.`;
}

/** Llama a la API REST (generateContent) y pide JSON estructurado. */
async function requestClassification(apiKey: string, text: string, model: string): Promise<unknown> {
  // El nombre del modelo puede venir como "gemini-..." o "models/gemini-..."
  // (.env.example lo documenta con el prefijo). La URL del REST ya incluye
  // "/models/", así que quitamos un prefijo "models/" sobrante para evitar
  // un "models/models/..." que responde 404.
  const bare = model.replace(/^models\//, "");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${bare}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = {
    contents: [{ role: "user", parts: [{ text }] }],
    systemInstruction: { parts: [{ text: systemPrompt() }] },
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
    },
  };
  // Reintenta hasta 3 veces ante 503 (alta demanda transitoria). No usamos
  // fallback de modelos: los demás de Google tienen cupos mucho más bajos.
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status !== 503) {
      if (!res.ok) throw new Error(`generateContent HTTP ${res.status}`);
      const j = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const part = j.candidates?.[0]?.content?.parts?.find((p) => p.text != null);
      if (!part?.text) throw new Error("sin respuesta del modelo");
      return JSON.parse(part.text);
    }
    await Bun.sleep(300 * (attempt + 1));
  }
  throw new Error("generateContent 503 tras reintentos");
}

function normalizeAction(name: string): string | null {
  if (!name) return null;
  const n = name.trim().toLowerCase().replace(/[\s_]+/g, "_");
  if (ACTIONS[n]) return n;
  // Matcheo por sinónimo parcial: "guardar" → save, etc.
  const alias: Record<string, string> = {
    guardar: "save", guarda: "save", save: "save", guardado: "save",
    deshacer: "undo", deshace: "undo", undo: "undo", atras: "undo",
    rehacer: "redo", rehace: "redo", redo: "redo",
    nueva_linea: "newline", enter: "newline", salto: "newline",
    cerrar: "close_tab", cerrar_pestana: "close_tab",
    siguiente: "next_tab", siguiente_pestana: "next_tab",
    anterior: "prev_tab", anterior_pestana: "prev_tab",
    seleccionar_todo: "select_all",
    copiar: "copy", copia: "copy",
    cortar: "cut", corta: "cut",
    pegar: "paste", pega: "paste",
    buscar: "find",
    cancelar: "cancel", cancela: "cancel", basta: "cancel", detente: "cancel",
  };
  return alias[n] ?? null;
}

/**
 * Clasifica texto transcrito como comando o dictado.
 * Ante cualquier duda/error, devuelve dictation (fallback seguro).
 */
export async function interpret(
  text: string,
  apiKey: string,
  model: string = process.env.GEMINI_CMD_MODEL ?? DEFAULT_CMD_MODEL,
): Promise<Interpretation> {
  const trimmed = text.trim();
  if (!trimmed) return { kind: "dictation", text: "" };
  try {
    const raw = await requestClassification(apiKey, trimmed, model);
    const obj = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
    if (obj.kind === "command") {
      const action = normalizeAction(String(obj.action ?? ""));
      if (action) return { kind: "command", action, args: {} };
    }
    return { kind: "dictation", text: trimmed };
  } catch (e) {
    return { kind: "dictation", text: trimmed };
  }
}

/** Ejecuta una acción de comando usando las dependencias inyectadas. */
export function runCommand(actionName: string, deps: CommandDeps): boolean {
  const action = ACTIONS[actionName];
  if (!action) return false;
  if (action.noop) {
    deps.notify("🧭 Comando", action.description);
    deps.log(`[comando] ${action.name} (noop)`);
    return true;
  }
  if (!deps.focusZed()) {
    deps.notify("⚠️ No pude enfocar Zed", action.description);
    return false;
  }
  const ok = deps.sendKeys(action.combo);
  if (ok) {
    deps.notify("🧭 Comando", action.description);
    deps.log(`[comando] ${action.name} → ${action.combo}`);
  } else {
    deps.notify("⚠️ No pude enviar teclas", action.description);
  }
  return ok;
}
