import { readFileSync } from "node:fs";
import { parseWav, pcm16ToBase64, interleaveToMono } from "./src/wav";
import { GeminiLiveClient } from "./src/live-client";

const wavBytes = new Uint8Array(readFileSync("clip16k.wav"));
const wav = parseWav(wavBytes);
const pcm = wav.channels > 1 ? interleaveToMono(wav.data, wav.channels) : wav.data;
console.log(`wav: ${wav.durationSec.toFixed(2)}s`);

// Interceptar WebSocket para loguear raw inbound/outbound y close/error
const OrigWS = globalThis.WebSocket;
// @ts-ignore
globalThis.WebSocket = class extends (OrigWS as unknown as typeof WebSocket) {
  constructor(url: string | URL, protocols?: string | string[]) {
    super(url, protocols);
    const ws = this as unknown as {
      readyState: number;
      send(d: string): void;
      addEventListener(type: string, fn: (ev: any) => void, opts?: object): void;
      close(): void;
    };
    const origSend = ws.send.bind(ws);
    ws.send = (d: string) => {
      try {
        const parsed = JSON.parse(d);
        if (parsed.setup) console.log("[raw] >> setup");
        else if (parsed.clientContent) console.log("[raw] >> clientContent");
        else if (parsed.realtimeInput?.audio) {
          const b64: string = parsed.realtimeInput.audio.data;
          console.log(`[raw] >> audio-chunk ${b64.length} chars`);
        } else if (parsed.realtimeInput?.audioStreamEnd) console.log("[raw] >> audio-end");
        else console.log("[raw] >> other:", d.slice(0, 200));
      } catch { /* ignore */ }
      return origSend(d);
    };
    const origAdd = ws.addEventListener.bind(ws);
    ws.addEventListener = (type: string, fn: (ev: any) => void, opts?: object) => {
      if (type === "message") {
        const wrapped = (ev: any) => {
          console.log(`[raw] << ${String(ev.data).slice(0, 400)}`);
          fn(ev);
        };
        return origAdd(type, wrapped, opts);
      }
      if (type === "close") {
        const wrapped = (ev: any) => {
          console.log(`[raw] << CLOSE code=${ev.code} reason=${JSON.stringify(ev.reason)}`);
          fn(ev);
        };
        return origAdd(type, wrapped, opts);
      }
      if (type === "error") {
        const wrapped = (ev: any) => { console.log(`[raw] << ERROR ${String(ev.message)}`); fn(ev); };
        return origAdd(type, wrapped, opts);
      }
      return origAdd(type, fn, opts);
    };
  }
};

const model = process.env.GEMINI_LIVE_MODEL ?? "models/gemini-3.8-live";
console.log(`modelo: ${model}`);

const client = new GeminiLiveClient(
  { apiKey: process.env.GEMINI_API_KEY!, model, generationConfig: { responseModalities: ["TEXT"] } },
  {
    onServerContent: (e) => {
      console.log(`[diag] serverContent text=${JSON.stringify(e.text)} transcription=${JSON.stringify(e.transcription)} isFinal=${e.isFinal} audio=${e.audioBase64 ? e.audioBase64.length : 0}b`);
    },
    onSetupComplete: () => console.log("[diag] setupComplete"),
    onTurnComplete: () => console.log("[diag] turnComplete"),
  },
);

client.connect().then(
  () => {
    const CHUNK = 16384;
    (async () => {
      client.sendText("Transcribe el audio siguiente palabra por palabra.", false);
      for (let i = 0; i < pcm.length; i += CHUNK) {
        client.sendRealtimeAudio(pcm16ToBase64(pcm.subarray(i, i + CHUNK)));
        await Bun.sleep(20);
      }
      client.endAudioStream();
      await Bun.sleep(12000);
      client.close();
      process.exit(0);
    })();
  },
  (err) => { console.error("[diag] connect FALLÓ:", err); process.exit(1); },
);
