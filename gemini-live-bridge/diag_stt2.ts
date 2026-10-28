// Diagnóstico v2: loguea TODOS los mensajes crudos del WebSocket.
import { readFileSync } from "node:fs";
import { parseWav, pcm16ToBase64, interleaveToMono } from "./src/wav";
import { GeminiLiveClient } from "./src/live-client";

const wavBytes = new Uint8Array(readFileSync("clip16k.wav"));
const wav = parseWav(wavBytes);
const pcm = wav.channels > 1 ? interleaveToMono(wav.data, wav.channels) : wav.data;

type WsLike = {
  readyState: number;
  send(data: string): void;
  addEventListener(type: string, fn: (ev: MessageEvent) => void, opts?: object): void;
  close(): void;
};

// Interceptar WebSocket: loguear raw inbound y outbound
const OrigWS = globalThis.WebSocket;
// @ts-ignore
globalThis.WebSocket = class extends (OrigWS as unknown as typeof WebSocket) {
  constructor(url: string | URL, protocols?: string | string[]) {
    super(url, protocols);
    const ws = this as unknown as WsLike;
    const origSend = ws.send.bind(ws);
    ws.send = (d: string) => {
      try {
        const parsed = JSON.parse(d);
        if (parsed.setup) console.log("[raw] >> setup (compactado)");
        else if (parsed.realtimeInput?.audio) {
          const b64: string = parsed.realtimeInput.audio.data;
          console.log(`[raw] >> audio-chunk base64=${b64.length} chars (~${Math.floor(b64.length * 3 / 4)} bytes)`);
        } else if (parsed.realtimeInput?.audioStreamEnd) console.log("[raw] >> audio-end");
        else console.log("[raw] >> other:", d.slice(0, 300));
      } catch { console.log("[raw] >> non-JSON"); }
      return origSend(d);
    };
    const origAdd = ws.addEventListener.bind(ws);
    ws.addEventListener = (type: string, fn: (ev: MessageEvent) => void, opts?: object) => {
      if (type === "message") {
        const wrapped = (ev: MessageEvent) => {
          console.log(`[raw] << message: ${String(ev.data).slice(0, 400)}`);
          fn(ev);
        };
        return origAdd(type, wrapped, opts);
      }
      return origAdd(type, fn, opts);
    };
  }
};

const model = process.env.GEMINI_STT_MODEL ?? "models/gemini-3.5-transcribe-live";
const client = new GeminiLiveClient(
  { apiKey: process.env.GEMINI_API_KEY!, model, generationConfig: { responseModalities: ["TEXT"] } },
  {
    onServerContent: (e) => console.log("[diag] onServerContent →", JSON.stringify(e)),
    onSetupComplete: () => console.log("[diag] onSetupComplete"),
    onTurnComplete: () => console.log("[diag] onTurnComplete"),
  },
);

client.connect().then(
  () => {
    const CHUNK = 16384;
    (async () => {
      for (let i = 0; i < pcm.length; i += CHUNK) {
        client.sendRealtimeAudio(pcm16ToBase64(pcm.subarray(i, i + CHUNK)));
        await Bun.sleep(20);
      }
      client.endAudioStream();
      await Bun.sleep(8000);
      client.close();
      process.exit(0);
    })();
  },
  (err: unknown) => { console.error("[diag] connect FALLÓ:", err); process.exit(1); },
);
