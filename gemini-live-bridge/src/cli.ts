#!/usr/bin/env bun
/**
 * Punto de entrada único del sidecar de voz sobre la Gemini Live API.
 *
 *   bun run src/cli.ts transcribe archivo.wav   # STT desde un WAV
 *   bun run src/cli.ts chat                     # bucle voz → omp → voz
 *   bun run src/cli.ts chat archivo.wav         # un turno desde un WAV
 *   bun run src/cli.ts record out.wav [seg]     # grabar un WAV (captura fija)
 *   bun run src/cli.ts dictate                   # dictado → portapapeles (pega con Ctrl+V)
 */

import { spawn, spawnSync } from "node:child_process";

import { transcribeFile, listenAndTranscribe } from "./stt";
import { speakText } from "./tts";

const ENV_KEY = process.env.GEMINI_API_KEY;
if (!ENV_KEY) {
  console.error("Falta GEMINI_API_KEY (copiá .env.example a .env)");
  process.exit(1);
}
const API_KEY: string = ENV_KEY;

const now = (): string => new Date().toISOString().slice(11, 19);
const msg = (e: unknown): string => (e instanceof Error ? e.message : String(e));

function usage(): never {
  console.log(`Uso:
  bun run src/cli.ts transcribe archivo.wav   # STT desde un WAV
  bun run src/cli.ts chat                     # bucle voz → omp → voz
  bun run src/cli.ts chat archivo.wav         # un turno desde un WAV
  bun run src/cli.ts record out.wav [seg]     # grabar un WAV (captura fija)
  bun run src/cli.ts dictate                   # dictado → portapapeles (pega con Ctrl+V)`);
  process.exit(1);
}

async function cmdTranscribe(wavPath?: string): Promise<void> {
  if (!wavPath) {
    console.error("Uso: bun run src/cli.ts transcribe archivo.wav");
    process.exit(1);
  }
  const wavBytes = new Uint8Array(await Bun.file(wavPath).arrayBuffer());
  console.log("transcribiendo…");
  const text = await transcribeFile(API_KEY, wavBytes, {
    onInterim: (t) => console.log("[stream] " + t),
  });
  if (text) console.log("\nTRANSCRIPCIÓN FINAL:\n" + text);
  else console.log("\n(sin transcripción recibida)");
}

function cmdRecord(outPath?: string, seconds = 6): void {
  if (!outPath) {
    console.error("Uso: bun run src/cli.ts record out.wav [seg]");
    process.exit(1);
  }
  console.log(`grabando ${seconds}s fijos (hablá durante la grabación)…`);
  const res = spawnSync(
    "timeout",
    [
      String(seconds),
      "rec",
      "-r", "16000", "-c", "1", "-e", "signed-integer", "-b", "16",
      outPath,
    ],
    { stdio: "inherit", timeout: 60_000 },
  );
  if (res.status !== 0) {
    console.error(`rec exit=${res.status}`);
    process.exit(res.status ?? 1);
  }
  console.log(`grabado: ${outPath}`);
}

function sanitizeForSpeech(s: string): string {
  return s
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*([^*]*)\*\*/g, "$1")
    .replace(/\*([^*]*)\*/g, "$1")
    .replace(/#+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Consulta a omp de forma ASÍNCRONA, streameando su salida en vivo.
 *
 * Clave: para un loop de VOZ omp debe comportarse como asistente conversacional,
 * NO como agente de codificación. Sin `--no-tools`, ante cualquier prompt real
 * omp se pone a explorar/analizar el repo: tarda 30-46s y a veces falla (exit 1).
 * Con `--no-tools` + system prompt conversacional responde en ~3s y estable.
 *
 * Flags:
 *  - --no-tools: nada de herramientas/exploración → rápido y confiable
 *  - --system-prompt: instrucción conversacional concisa
 *  - --no-session: evita auto-resumir una sesión vieja que se pueda trabar
 *  - --thinking off: respuesta más rápida (voz)
 *  - --max-time 45: tope duro interno (el spawn le da 50s)
 */
function askOmp(text: string): Promise<string> {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const MAX_MS = 50_000;
    const args = [
      "-p",
      "--no-tools",
      "--no-session",
      "--thinking", "off",
      "--max-time", "45",
      "--system-prompt",
      "Eres un asistente de voz. Responde breve y conversacionalmente, en una o dos frases, sin usar herramientas ni explorar el repositorio.",
      text,
    ];

    const child = spawn("omp", args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";

    const killer = setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch {
        /* ya cerrado */
      }
    }, MAX_MS);

    child.stdout.on("data", (d) => {
      out += d;
      const s = String(d);
      if (!s.includes("Working...")) process.stdout.write(s);
    });
    child.stderr.on("data", (d) => process.stdout.write(String(d)));

    child.on("error", () => {
      clearTimeout(killer);
      resolve("");
    });
    child.on("close", (code) => {
      clearTimeout(killer);
      const secs = ((Date.now() - t0) / 1000).toFixed(0);
      if (code !== 0) {
        console.log(`[${now()}] (omp terminó con code ${code} tras ${secs}s)`);
        resolve("");
        return;
      }
      const lines = out
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && l !== "Working...");
      resolve(sanitizeForSpeech(lines.join(" ")));
    });
  });
}

async function cmdChat(clipArg?: string): Promise<void> {
  if (clipArg) {
    await runTurnWav(clipArg);
    return;
  }

  console.log("Loop voz→omp→voz. Ctrl+C para salir.");
  for (;;) {
    // 1) Escuchar (STT en vivo).
    console.log(`\n[${now()}] 🎤 escuchando…`);
    let text = "";
    try {
      text = await listenAndTranscribe(API_KEY, {
        onInterim: (t) => console.log("  [stream]", t),
      });
    } catch (e) {
      console.error(`[${now()}] (error al escuchar) ${msg(e)}`);
      await Bun.sleep(1000);
      continue;
    }
    if (!text) {
      console.log(`[${now()}] (sin transcripción — vuelvo a escuchar)`);
      continue;
    }
    console.log(`[${now()}] 🗣️ tú: ${text}`);

    // 2) Consultar omp.
    console.log(`[${now()}] 🗣 consultando omp…`);
    let reply = "";
    try {
      reply = await askOmp(text);
    } catch (e) {
      console.error(`[${now()}] (error omp) ${msg(e)}`);
      continue;
    }
    if (!reply) {
      console.log(`[${now()}] (omp sin respuesta)`);
      continue;
    }
    console.log(`[${now()}] 🤖 omp: ${reply}`);

    // 3) Responder por voz (TTS). Un fallo acá NO corta el loop.
    console.log(`[${now()}] …generando y reproduciendo voz`);
    try {
      const r = await speakText(API_KEY, reply);
      const durationSec = r.bytes / 2 / r.sampleRate;
      console.log(
        `[${now()}] 🔊 audio: ${r.bytes} bytes @ ${r.sampleRate} Hz (${durationSec.toFixed(1)}s)`,
      );
    } catch (e) {
      console.error(`[${now()}] (error TTS) ${msg(e)} — sigo con el siguiente turno`);
    }

    // El playback ya terminó (playPcm espera el `close` de aplay). Este margen
    // mínimo solo deja asentar el cambio de dispositivo mic/altavoz; no
    // enmascara eco,eso lo garantiza esperar el cierre de aplay.
    await Bun.sleep(250);
  }
}

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

async function runTurnWav(wavPath: string): Promise<void> {
  const wavBytes = new Uint8Array(await Bun.file(wavPath).arrayBuffer());
  if (wavBytes.length < 44) {
    console.log("(grabación vacía)");
    return;
  }
  const text = await transcribeFile(API_KEY, wavBytes, {
    onInterim: (t) => console.log("  [stream]", t),
  });
  if (!text) {
    console.log("(sin transcripción)");
    return;
  }
  console.log(`[${now()}] 🗣️ tú: ${text}`);
  console.log(`[${now()}] 🗣 consultando omp…`);
  const reply = await askOmp(text);
  if (!reply) {
    console.log("(omp sin respuesta)");
    return;
  }
  console.log(`[${now()}] 🤖 omp: ${reply}`);
  console.log(`[${now()}] …generando y reproduciendo voz`);
  try {
    const r = await speakText(API_KEY, reply);
    const durationSec = r.bytes / 2 / r.sampleRate;
    console.log(
      `[${now()}] 🔊 audio: ${r.bytes} bytes @ ${r.sampleRate} Hz (${durationSec.toFixed(1)}s)`,
    );
  } catch (e) {
    console.error(`[${now()}] (error TTS) ${msg(e)}`);
  }
}

const [cmd, ...rest] = process.argv.slice(2);
switch (cmd) {
  case "transcribe":
    await cmdTranscribe(rest[0]);
    break;
  case "chat":
    await cmdChat(rest[0]);
    break;
  case "record":
    cmdRecord(rest[0], Number(rest[1]) || 6);
    break;
  case "dictate":
    await cmdDictate();
    break;
  default:
    usage();
}
