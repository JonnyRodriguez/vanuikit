// Diagnóstico: conecta a la Live API STT, envía clip16k.wav y loguea TODO lo que llega del servidor.
import { readFileSync } from "node:fs";
import { parseWav, pcm16ToBase64, interleaveToMono } from "./src/wav";
import { GeminiLiveClient } from "./src/live-client";

const wavBytes = new Uint8Array(readFileSync("clip16k.wav"));
const wav = parseWav(wavBytes);
const pcm = wav.channels > 1 ? interleaveToMono(wav.data, wav.channels) : wav.data;
console.log(`[diag] wav: ${wav.durationSec.toFixed(2)}s rate=${wav.sampleRate} ch=${wav.channels} bits=${wav.bitsPerSample} bytes=${pcm.length}`);

const model = process.env.GEMINI_STT_MODEL ?? "models/gemini-3.5-transcribe-live";
console.log(`[diag] modelo STT: ${model}`);

const client = new GeminiLiveClient(
  { apiKey: process.env.GEMINI_API_KEY!, model, generationConfig: { responseModalities: ["TEXT"] } },
  {
    onServerContent: (e: { text: string; transcription?: string; isFinal?: boolean; audioBase64?: string }) => {
      console.log(`[diag] << serverContent text=${JSON.stringify(e.text)} transcription=${JSON.stringify(e.transcription)} isFinal=${e.isFinal} audio=${e.audioBase64 ? e.audioBase64.length : 0}b`);
    },
    onSetupComplete: () => console.log("[diag] << setupComplete"),
    onTurnComplete: () => console.log("[diag] << turnComplete"),
    onToolCall: (fc: { id: string; name: string; args: Record<string, unknown> }) => console.log("[diag] << toolCall", fc),
  },
);

client.connect().then(
  () => {
    console.log("[diag] connect OK (setupComplete recibido)");
    const CHUNK = 16384;
    (async () => {
      for (let i = 0; i < pcm.length; i += CHUNK) {
        client.sendRealtimeAudio(pcm16ToBase64(pcm.subarray(i, i + CHUNK)));
        await Bun.sleep(20);
      }
      console.log("[diag] audio enviado completo, marcando fin de stream…");
      client.endAudioStream();
      await Bun.sleep(8000);
      console.log("[diag] diagnóstico terminado (tras 8s sin actividad)");
      client.close();
      process.exit(0);
    })();
  },
  (err: unknown) => {
    console.error("[diag] connect FALLÓ:", err);
    process.exit(1);
  },
);
