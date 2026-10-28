// Diagnóstico v3: enviar el WAV completo como clientContent con inlineData (no realtimeInput)
import { readFileSync } from "node:fs";
import { GeminiLiveClient } from "./src/live-client";

const wavBytes = new Uint8Array(readFileSync("clip16k.wav"));
const b64 = Buffer.from(wavBytes).toString("base64");
console.log(`wav bytes=${wavBytes.length} b64=${b64.length} chars`);

// Interceptar WebSocket para loguear todo
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
        else if (parsed.clientContent) console.log(`[raw] >> clientContent turns=${JSON.stringify(parsed.clientContent.turns)?.slice(0,300)}`);
        else console.log("[raw] >> other:", d.slice(0, 300));
      } catch { /* ignore */ }
      return origSend(d);
    };
    const origAdd = ws.addEventListener.bind(ws);
    ws.addEventListener = (type: string, fn: (ev: any) => void, opts?: object) => {
      if (type === "message") {
        const wrapped = (ev: any) => {
          console.log(`[raw] << ${String(ev.data).slice(0, 600)}`);
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
      return origAdd(type, fn, opts);
    };
  }
};

const model = process.env.GEMINI_STT_MODEL ?? "models/gemini-3.5-transcribe-live";
console.log(`modelo STT: ${model}`);

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
    // Enviar el WAV completo como clientContent con inlineData
    client.send({
      clientContent: {
        turns: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: "audio/wav", data: b64 } },
            ],
          },
        ],
        turnComplete: true,
      },
    });
    setTimeout(() => {
      client.close();
      process.exit(0);
    }, 15000);
  },
  (err: unknown) => { console.error("[diag] connect FALLÓ:", err); process.exit(1); },
);
