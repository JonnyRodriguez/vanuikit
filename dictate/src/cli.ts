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
 * Envía Ctrl+V. Primero intenta ydotool (inyección a nivel sistema, socket del
 * daemon); si falla, cae a wtype. Devuelve el método usado o "" si nada sirvió.
 */
function pasteCtrlV(): string {
  const y = spawnSync(
    "ydotool",
    ["key", "29:1", "47:1", "47:0", "29:0"],
    {
      env: { ...process.env, YDOTOOL_SOCKET: "/run/ydotool.socket" },
      stdio: "ignore",
    },
  );
  if (y.status === 0) return "ydotool";
  const w = spawnSync("wtype", ["-M", "ctrl", "-k", "v"], {
    stdio: "ignore",
  });
  return w.status === 0 ? "wtype" : "";
}

/** Enfoca Zed y pega el portapapeles. Devuelve el método usado o "". */
async function autoPasteIntoZed(): Promise<string> {
  if (!focusZedWindow()) return "";
  await Bun.sleep(180);
  return pasteCtrlV();
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

    try {
      await clipboardCopy(finalText);
    } catch (e) {
      console.error(`[${now()}] (error al copiar) ${msg(e)}`);
      sendNotify("⚠️ Error al copiar", msg(e));
      continue;
    }
    console.log(`[${now()}] 📋 copiado`);

    const method = await autoPasteIntoZed();
    if (method) {
      console.log(`[${now()}] ⌨️ pegado en Zed (${method})`);
      sendNotify("✅ Pegado en Zed", finalText);
    } else {
      console.log(`[${now()}] ⚠️ no pude pegar solo — usá Ctrl+V`);
      sendNotify("📋 Copiado — pega con Ctrl+V", finalText);
    }

    await Bun.sleep(250);
  }
}

await cmdDictate();
