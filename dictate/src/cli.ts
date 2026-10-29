#!/usr/bin/env bun
/**
 * Dictado por voz → Zed (paquete independiente `dictate`).
 *
 * Escucha el micrófono (Gemini Live STT), y al soltar la voz copia la
 * transcripción al portapapeles y la pega en el editor de Zed bajo el cursor.
 * Sin respuestas en voz.
 *
 * Uso:
 *   bun run src/cli.ts
 *   bun dictate            (si instalás el paquete con `bun link`)
 */

import { spawn, spawnSync } from "node:child_process";

import { listenAndTranscribe } from "./stt";
import { interpret, runCommand, type CommandDeps } from "./commands";

const ENV_KEY = process.env.GEMINI_API_KEY;
if (!ENV_KEY) {
  console.error("Falta GEMINI_API_KEY (copiá .env.example a .env)");
  process.exit(1);
}
const API_KEY: string = ENV_KEY;

const now = (): string => new Date().toISOString().slice(11, 19);
const msg = (e: unknown): string => (e instanceof Error ? e.message : String(e));

/**
 * Copia texto al portapapeles de Wayland (wl-copy). Resuelve cuando se
 * confirma el pegado en el clipboard.
 */
function clipboardCopy(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const c = spawn("wl-copy", [], { stdio: ["pipe", "ignore", "ignore"] });
    c.on("error", (e) => reject(new Error(`wl-copy: ${e.message}`)));
    c.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`wl-copy exit=${code}`)),
    );
    c.stdin.on("error", () => {});
    c.stdin.write(text);
    c.stdin.end();
  });
}

/** ID fijo para reemplazar la misma notificación (evita amontonar popups). */
const NOTIFY_ID = 7700;

/** Notificación de escritorio (se ve aunque el terminal esté oculto). */
function sendNotify(title: string, body: string): void {
  const c = spawn(
    "notify-send",
    ["-a", "dictado", "-r", String(NOTIFY_ID), title, body],
    { stdio: "ignore" },
  );
  c.on("error", () => {});
}

/**
 * Localiza la ventana de Zed y la activa (cambia de escritorio si hace falta).
 * Devuelve el id de ventana si lo logró, o null.
 */
function focusZedWindow(): string | null {
  const res = spawnSync("kdotool", ["search", "--class", "zed"], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (res.status !== 0) return null;
  const id = res.stdout
    ?.toString()
    .trim()
    .split("\n")
    .find((l) => l.trim())
    ?.trim();
  if (!id) return null;
  const act = spawnSync("kdotool", ["windowactivate", id], {
    stdio: "ignore",
  });
  return act.status === 0 ? id : null;
}

/**
 * Mapa de keycodes Linux/evdev para combos comunes (ydotool usa números).
 */
const KEYCODES: Record<string, number> = {
  ctrl: 29,
  shift: 42,
  alt: 56,
  super: 125,
  enter: 28,
  tab: 15,
  space: 57,
  backspace: 14,
  esc: 1,
  a: 30, b: 48, c: 46, d: 32, e: 18, f: 33, g: 34, h: 35,
  i: 23, j: 36, k: 37, l: 38, m: 50, n: 49, o: 24, p: 25,
  q: 16, r: 19, s: 31, t: 20, u: 22, v: 47, w: 17, x: 45,
  y: 21, z: 44,
  "1": 2, "2": 3, "3": 4, "4": 5, "5": 6, "6": 7, "7": 8,
  "8": 9, "9": 10, "0": 11,
};

/** Separa un combo tipo "ctrl+shift+z" en [modificadores..., tecla]. */
function parseCombo(combo: string): { mods: number[]; key: number } {
  const parts = combo.split("+").map((p) => p.trim().toLowerCase());
  const mods: number[] = [];
  let key = -1;
  for (const p of parts) {
    if (p === "ctrl" || p === "shift" || p === "alt" || p === "super") {
      const c = KEYCODES[p];
      if (c !== undefined && !mods.includes(c)) mods.push(c);
    } else {
      const c = KEYCODES[p];
      if (c !== undefined) key = c;
    }
  }
  return { mods, key };
}

/**
 * Inyecta un combo de teclas (p. ej. "ctrl+s"). Primero intenta ydotool
 * (inyección a nivel sistema, socket del daemon); si falla, cae a wtype.
 * Devuelve true si se envió por algún método.
 */
function sendKeys(combo: string): boolean {
  const { mods, key } = parseCombo(combo);
  if (key < 0) return false;

  // ydotool key: presionar en orden (mods luego tecla), liberar en reverse.
  const press = [...mods, key];
  const release = [...press].reverse();
  const keyArgs = press.flatMap((c) => [`${c}:1`]).concat(release.flatMap((c) => [`${c}:0`]));
  const y = spawnSync("ydotool", ["key", ...keyArgs], {
    env: { ...process.env, YDOTOOL_SOCKET: "/run/ydotool.socket" },
    stdio: "ignore",
  });
  if (y.status === 0) return true;

  // Fallback wtype: -M <mod> ... -k <tecla>
  const modNames = mods.map((c) =>
    c === KEYCODES.ctrl ? "ctrl" : c === KEYCODES.shift ? "shift" : c === KEYCODES.alt ? "alt" : "super",
  );
  const keyName = Object.entries(KEYCODES).find(([, c]) => c === key)?.[0];
  if (!keyName) return false;
  const wArgs = modNames.flatMap((m) => ["-M", m]);
  wArgs.push("-k", keyName);
  const w = spawnSync("wtype", wArgs, { stdio: "ignore" });
  return w.status === 0;
}

/** Enfoca Zed y pega el portapapeles. Devuelve true si se pegó. */
async function autoPasteIntoZed(): Promise<boolean> {
  if (!focusZedWindow()) return false;
  await Bun.sleep(180);
  return sendKeys("ctrl+v");
}

const DICTATE_PIDFILE = ".dictate.pid";

async function readDictatePid(): Promise<number | null> {
  try {
    const s = (await Bun.file(DICTATE_PIDFILE).text()).trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isInteger(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

function dictatePidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function clearDictatePid(): void {
  try {
    Bun.spawnSync(["rm", "-f", DICTATE_PIDFILE]);
  } catch {
    /* no-op */
  }
}

/**
 * Dictado por voz → Zed. Reutiliza listenAndTranscribe() (el STT ya validado)
 * y muestra el estado en notificaciones para que se vea aunque el terminal esté
 * oculto. Sin respuestas en voz.
 *
 * Alt+D actúa como TOGGLE: si ya hay un dictado activo (pidfile vivo), este
 * proceso lo detiene y sale; si no, se convierte en el dictado en curso.
 */
async function cmdDictate(): Promise<void> {
  // Toggle Alt+D: si ya hay un dictado activo, lo detengo y salgo.
  const existing = await readDictatePid();
  if (existing && dictatePidAlive(existing)) {
    console.log(`[${now()}] ⏹ Detengo el dictado activo (PID ${existing})`);
    sendNotify("⏹ Dictado detenido", "Ya no estoy escuchando.");
    try {
      process.kill(existing, "SIGTERM");
    } catch {
      /* ya muerto */
    }
    clearDictatePid();
    return;
  }

  // No había ninguno activo → este proceso es el dictado en curso.
  clearDictatePid();
  await Bun.write(DICTATE_PIDFILE, String(process.pid));

  const onExit = (): void => {
    clearDictatePid();
    process.exit(0);
  };
  process.on("SIGTERM", onExit);
  process.on("SIGINT", onExit);
  process.on("exit", clearDictatePid);

  sendNotify("🎤 Dictado", "Escuchando… (Alt+D para detener)");
  console.log("Dictado → Zed. Alt+D para iniciar/detener. Ctrl+C para salir.\n");

  let lastInterim = "";
  for (;;) {
    console.log(`[${now()}] 🎤 escuchando…`);
    let text = "";
    try {
      text = await listenAndTranscribe(API_KEY, {
        onInterim: (t) => {
          console.log("  [stream]", t);
          if (t && t !== lastInterim) {
            lastInterim = t;
            sendNotify("🗣️ Escuchando…", t);
          }
        },
      });
    } catch (e) {
      console.error(`[${now()}] (error al escuchar) ${msg(e)}`);
      sendNotify("⚠️ Error al escuchar", msg(e));
      await Bun.sleep(1000);
      continue;
    }
    const finalText = text.trim();
    if (!finalText) {
      console.log(`[${now()}] (sin transcripción — vuelvo a escuchar)`);
      continue;
    }
    console.log(`[${now()}] 🗣️ dictado: ${finalText}`);

    // Nivel 2: el intérprete decide si es comando o dictado.
    const intent = await interpret(finalText, API_KEY);
    if (intent.kind === "command") {
      const deps: CommandDeps = {
        focusZed: () => !!focusZedWindow(),
        sendKeys,
        notify: sendNotify,
        log: (m) => console.log(`[${now()}] ${m}`),
      };
      runCommand(intent.action, deps);
      continue;
    }
    const toPaste = intent.text;

    try {
      await clipboardCopy(toPaste);
    } catch (e) {
      console.error(`[${now()}] (error al copiar) ${msg(e)}`);
      sendNotify("⚠️ Error al copiar", msg(e));
      continue;
    }
    console.log(`[${now()}] 📋 copiado`);

    const ok = await autoPasteIntoZed();
    if (ok) {
      console.log(`[${now()}] ⌨️ pegado en Zed`);
      sendNotify("✅ Pegado en Zed", toPaste);
    } else {
      console.log(`[${now()}] ⚠️ no pude pegar solo — usá Ctrl+V`);
      sendNotify("📋 Copiado — pega con Ctrl+V", toPaste);
    }

    await Bun.sleep(250);
  }
}

await cmdDictate();
