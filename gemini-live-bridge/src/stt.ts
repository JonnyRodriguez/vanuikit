/**
 * Transcripción por la Gemini Live API (streaming interim), modelo por defecto
 * gemini-3.5-transcribe-live con responseModalities ["TEXT"] (verificado).
 *
 * Dos entradas:
 *  - transcribeFile(): un WAV ya grabado (16 kHz PCM16 mono).
 *  - listenAndTranscribe(): micrófono en vivo (arecord); la detección de
 *    actividad es del SERVIDOR (llegan interim y luego inputTranscription final).
 */

import { spawn, type ChildProcess } from "node:child_process";

import { GeminiLiveClient } from "./live-client";
import { parseWav, pcm16ToBase64, interleaveToMono } from "./wav";

const DEFAULT_STT_MODEL = "models/gemini-3.5-transcribe-live";

export interface TranscribeOptions {
  model?: string;
  onInterim?: (text: string) => void;
}

/** Transcribe un WAV (PCM16 a 16 kHz) con la Live API. */
export async function transcribeFile(
  apiKey: string,
  wavBytes: Uint8Array,
  options: TranscribeOptions = {},
): Promise<string> {
  const model = options.model ?? process.env.GEMINI_STT_MODEL ?? DEFAULT_STT_MODEL;

  const wav = parseWav(wavBytes);
  if (wav.sampleRate !== 16000 || wav.bitsPerSample !== 16) {
    throw new Error(
      "La Live API espera PCM16 a 16000 Hz. Resampleá: ffmpeg -i in.wav -ar 16000 -ac 1 out.wav",
    );
  }
  const pcm = wav.channels > 1 ? interleaveToMono(wav.data, wav.channels) : wav.data;

  const transcriptions: string[] = [];
  const { promise: finished, resolve: finish } = Promise.withResolvers<void>();
  let lastActivityAt = Date.now();
  const quietTimer = setInterval(() => {
    if (Date.now() - lastActivityAt > 2000) finish();
  }, 500);
  const fallbackTimer = setTimeout(() => finish(), 30_000);

  const client = new GeminiLiveClient(
    {
      apiKey,
      model,
      generationConfig: { responseModalities: ["TEXT"] },
    },
    {
      onServerContent: ({ transcription }) => {
        if (transcription) {
          lastActivityAt = Date.now();
          transcriptions.push(transcription);
          options.onInterim?.(transcription);
        }
      },
      onTurnComplete: () => finish(),
    },
  );

  try {
    await client.connect();
    const CHUNK = 16384;
    for (let i = 0; i < pcm.length; i += CHUNK) {
      client.sendRealtimeAudio(pcm16ToBase64(pcm.subarray(i, i + CHUNK)));
      await Bun.sleep(20);
    }
    client.endAudioStream();
    await finished;
  } finally {
    clearInterval(quietTimer);
    clearTimeout(fallbackTimer);
    client.close();
  }

  return transcriptions.at(-1) ?? transcriptions.join(" ").trim();
}

export interface ListenOptions {
  model?: string;
  onInterim?: (text: string) => void;
  maxMs?: number;
}

/**
 * Escucha el micrófono en vivo (arecord → PCM16 16 kHz) y lo envía a la Live
 * API de transcripción en streaming. La detección de actividad es del SERVIDOR:
 * llegan interim y luego inputTranscription final. Resuelve con el texto final
 * cuando el servidor marca el cierre (o pasan maxMs).
 */
export function listenAndTranscribe(
  apiKey: string,
  options: ListenOptions = {},
): Promise<string> {
  const model =
    options.model ?? process.env.GEMINI_STT_MODEL ?? DEFAULT_STT_MODEL;
  const maxMs = options.maxMs ?? Number(process.env.VOICE_MAX_REC_MS ?? "30000");
  const device = process.env.ARECORD_DEVICE;

  return new Promise<string>((resolve, reject) => {
    const finals: string[] = [];
    let stopped = false;

    let client: GeminiLiveClient;
    let rec: ChildProcess;
    let hardTimer: ReturnType<typeof setTimeout>;

    const stop = (): void => {
      clearTimeout(hardTimer);
      try {
        rec?.kill();
      } catch {
        /* ya cerrado */
      }
      try {
        client?.close();
      } catch {
        /* ya cerrado */
      }
    };

    const finish = (text: string): void => {
      if (stopped) return;
      stopped = true;
      stop();
      resolve(text);
    };

    const fail = (e: unknown): void => {
      if (stopped) return;
      stopped = true;
      stop();
      reject(e instanceof Error ? e : new Error(String(e)));
    };

    client = new GeminiLiveClient(
      {
        apiKey,
        model,
        generationConfig: { responseModalities: ["TEXT"] },
      },
      {
        onServerContent: ({ transcription, isFinal }) => {
          if (!transcription) return;
          options.onInterim?.(transcription);
          if (isFinal) {
            finals.push(transcription);
            // Gracia corta para que el stream termine de llegar.
            setTimeout(() => finish(finals.at(-1) ?? ""), 400);
          }
        },
      },
    );

    client.connect().catch(fail).then(() => {
      if (stopped) return;
      const args = ["-f", "S16_LE", "-r", "16000", "-c", "1", "-t", "raw"];
      if (device) args.unshift("-D", device);
      rec = spawn("arecord", args, { stdio: ["ignore", "pipe", "ignore"] });

      rec.stdout?.on("data", (chunk: Buffer) => {
        if (stopped) return;
        try {
          client.sendRealtimeAudio(chunk.toString("base64"), "audio/pcm;rate=16000");
        } catch {
          /* socket en cierre */
        }
      });

      rec.on("error", (e) => fail(new Error(`arecord: ${e.message}`)));
      rec.on("close", () => {
        if (!stopped) finish(finals.at(-1) ?? "");
      });

      hardTimer = setTimeout(() => finish(finals.at(-1) ?? ""), maxMs);
    });
  });
}
