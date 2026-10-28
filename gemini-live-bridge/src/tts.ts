/**
 * Síntesis por la Live API (modelo gemini-3.8-live, respuesta AUDIO).
 *
 * Flujo del todo — la clave para no pisar el playback:
 *   1. receiveAudio(): recibe TODO el audio hasta la señal autoritativa
 *      `turnComplete` del servidor (validando cada bloque, descartando vacíos).
 *   2. Recién después reproduce el audio completo con aplay y ESPERA a que
 *      aplay cierre (evento `close` = terminó de reproducir). Solo ahí devuelve.
 *
 * Así garantizamos que NUNCA pasamos a escuchar mientras hay playback: el bucle
 * avanza únicamente cuando el altavoz terminó.
 */

import { spawn } from "node:child_process";

import { GeminiLiveClient } from "./live-client";
import { writeWavPcm } from "./wav";

const DEFAULT_LIVE_MODEL = "models/gemini-3.8-live";
const MIN_AUDIO_BYTES = 4096;
const MAX_ATTEMPTS = 3;
const READ_ALOUD = [
  "Eres un lector de voz. Lee EXACTAMENTE y únicamente el texto del usuario,",
  "palabra por palabra, sin cambios, sin añadidos ni paráfrasis.",
].join(" ");

export interface TtsResult {
  bytes: number;
  sampleRate: number;
  outPath: string;
}

export interface SpeakResult {
  bytes: number;
  sampleRate: number;
}

interface ReceivedAudio {
  pcm: Buffer;
  bytes: number;
  sampleRate: number;
}

/** Recibe el audio COMPLETO de la respuesta (hasta turnComplete o timeout). */
function receiveAudio(
  apiKey: string,
  text: string,
  model: string,
): Promise<ReceivedAudio> {
  const { promise, resolve, reject } = Promise.withResolvers<ReceivedAudio>();
  const chunks: string[] = [];
  let sampleRate = 24000;
  let firstAudioAt: number | null = null;
  let lastChunkAt = Date.now();
  let finished = false;

  const client = new GeminiLiveClient(
    {
      apiKey,
      model,
      generationConfig: { responseModalities: ["AUDIO"] },
      systemInstruction: READ_ALOUD,
    },
    {
      onServerContent: ({ audioBase64, sampleRate: sr }) => {
        if (audioBase64 && audioBase64.length > 0) {
          if (Buffer.from(audioBase64, "base64").length > 0) {
            if (firstAudioAt === null) firstAudioAt = Date.now();
            chunks.push(audioBase64);
            lastChunkAt = Date.now();
          }
        }
        if (sr !== undefined) sampleRate = sr;
      },
      // Señal autoritativa: el servidor terminó el turno de audio.
      onTurnComplete: () => finish(),
    },
  );

  // El silencio solo cuenta como fin después del primer audio; antes esperamos
  // el deadline duro (hardTimer).
  const quietTimer = setInterval(() => {
    if (firstAudioAt !== null && Date.now() - lastChunkAt > 1500) finish();
  }, 300);
  const hardTimer = setTimeout(() => finish(), 25_000);

  const finish = (): void => {
    if (finished) return;
    finished = true;
    clearInterval(quietTimer);
    clearTimeout(hardTimer);
    try {
      client.close();
    } catch {
      /* ya cerrado */
    }
    const pcm = Buffer.concat(chunks.map((c) => Buffer.from(c, "base64")));
    resolve({ pcm, bytes: pcm.length, sampleRate });
  };

  client.connect().then(() => client.sendText(text)).catch(reject);
  return promise;
}

/** Reproduce el PCM completo con aplay y espera a que termine (evento close). */
function playPcm(pcm: Buffer, sampleRate: number): Promise<void> {
  return new Promise<void>((resolve) => {
    const sr = sampleRate || 24000;
    const aplay = spawn("aplay", [
      "-f", "S16_LE",
      "-r", String(sr),
      "-c", "1",
    ]);
    let done = false;

    // Duración estimada del audio: el watchdog NUNCA debe cortar el playback.
    // Solo es una red de seguridad generosa, derivada de la duración real.
    const durationMs = (pcm.length / 2 / sr) * 1000;
    const watchdogMs = Math.min(Math.max(durationMs + 5000, 10_000), 600_000);

    const finish = (): void => {
      if (done) return;
      done = true;
      clearTimeout(watchdog);
      resolve();
    };

    // Resolvemos SOLO cuando aplay cerró (= terminó de reproducir).
    const watchdog = setTimeout(() => finish(), watchdogMs);
    aplay.once("error", () => finish());
    aplay.once("close", () => finish());

    aplay.stdin.on("error", () => {
      /* EPIPE etc.: no colgar */
    });
    aplay.stdin.write(pcm);
    aplay.stdin.end();
  });
}

async function withRetries<R extends { bytes: number }>(
  apiKey: string,
  text: string,
  model: string,
  run: (apiKey: string, text: string, model: string) => Promise<R>,
): Promise<R> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const result = await run(apiKey, text, model);
      if (result.bytes >= MIN_AUDIO_BYTES) return result;
      lastError = new Error(`audio demasiado corto (${result.bytes} bytes)`);
    } catch (e) {
      lastError = e;
    }
    if (attempt < MAX_ATTEMPTS) await Bun.sleep(800);
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function textToAudioFile(
  apiKey: string,
  text: string,
  outPath: string,
  model = process.env.GEMINI_LIVE_MODEL ?? DEFAULT_LIVE_MODEL,
): Promise<TtsResult> {
  const { pcm, bytes, sampleRate } = await withRetries(apiKey, text, model, (k, t, m) =>
    receiveAudio(k, t, m),
  );
  writeWavPcm(outPath, new Uint8Array(pcm), sampleRate);
  return { bytes, sampleRate, outPath };
}

export async function speakText(
  apiKey: string,
  text: string,
  model = process.env.GEMINI_LIVE_MODEL ?? DEFAULT_LIVE_MODEL,
): Promise<SpeakResult> {
  const result = await withRetries(apiKey, text, model, (k, t, m) =>
    receiveAudio(k, t, m).then(async ({ pcm, bytes }) => {
      await playPcm(pcm, 24000);
      return { bytes };
    }),
  );
  return { bytes: result.bytes, sampleRate: 24000 };
}
