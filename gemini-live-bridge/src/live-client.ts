/**
 * Cliente mínimo sobre la Gemini Live API (BidiGenerateContent) vía WebSocket.
 * Wire format verificado contra https://ai.google.dev/api/live (2026).
 *
 * Secuencia:
 *   1. abrir WS con ?key=...
 *   2. enviar { setup } (primer mensaje obligatorio)
 *   3. esperar { setupComplete }
 *   4. intercambiar clientContent / realtimeInput / toolResponse
 */

import { asString, isJsonObject, type JsonObject } from "./types";

export interface LiveOptions {
  apiKey: string;
  /** Formato: "models/gemini-2.5-flash-preview" */
  model: string;
  generationConfig?: Record<string, unknown>;
  systemInstruction?: string;
  tools?: unknown[];
}

export interface LiveCallbacks {
  onServerContent?: (content: {
    text: string;
    audioBase64?: string;
    transcription?: string;
    isFinal?: boolean;
    sampleRate?: number;
  }) => void;
  onToolCall?: (fc: { id: string; name: string; args: Record<string, unknown> }) => void;
  onSetupComplete?: () => void;
  onTurnComplete?: () => void;
}

export interface ServerContentEvent {
  text: string;
  audioBase64?: string;
  transcription?: string;
  isFinal?: boolean;
  sampleRate?: number;
}
function extractServerContent(sc: unknown): ServerContentEvent {
  const out: ServerContentEvent = { text: "" };
  if (!isJsonObject(sc)) return out;
  const modelTurn = sc.modelTurn;
  if (isJsonObject(modelTurn) && Array.isArray(modelTurn.parts)) {
    const audioParts: string[] = [];
    for (const rawPart of modelTurn.parts) {
      if (!isJsonObject(rawPart)) continue;
      const text = asString(rawPart.text);
      if (text !== undefined) out.text += text;
      const inline = rawPart.inlineData;
      if (isJsonObject(inline)) {
        const data = asString(inline.data);
        if (data !== undefined) audioParts.push(data);
        const mimeType = asString(inline.mimeType);
        const m = mimeType?.match(/rate=(\d+)/);
        if (m && m[1]) out.sampleRate = Number(m[1]);
      }
    }
    if (audioParts.length > 0) out.audioBase64 = audioParts.join("");
  }
  if (isJsonObject(sc.inputTranscription)) {
    const t = asString(sc.inputTranscription.text);
    if (t !== undefined) {
      out.transcription = t;
      out.isFinal = true;
    }
  } else if (isJsonObject(sc.interimInputTranscription)) {
    const t = asString(sc.interimInputTranscription.text);
    if (t !== undefined) out.transcription = t;
  }
  return out;
}

const ENDPOINT =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";

export class GeminiLiveClient {
  private readonly options: LiveOptions;
  private readonly cb: LiveCallbacks;
  private ws: WebSocket | null = null;
  private setupDone: Promise<void> | null = null;

  constructor(options: LiveOptions, cb: LiveCallbacks = {}) {
    this.options = options;
    this.cb = cb;
  }

  /** Abre la conexión, envía setup y resuelve cuando llega setupComplete. */
  connect(): Promise<void> {
    if (this.ws && this.setupDone) return this.setupDone;

    const url = `${ENDPOINT}?key=${encodeURIComponent(this.options.apiKey)}`;
    const ws = new WebSocket(url);
    this.ws = ws;

    const { promise, resolve, reject } = Promise.withResolvers<void>();
    let settled = false;
    const settleError = (err: unknown): void => {
      if (!settled) {
        settled = true;
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };

    ws.addEventListener("open", () => {
      try {
        this.send({
          setup: {
            model: this.options.model,
            ...(this.options.generationConfig
              ? { generationConfig: this.options.generationConfig }
              : {}),
            ...(this.options.systemInstruction
              ? {
                  systemInstruction:
                    typeof this.options.systemInstruction === "string"
                      ? { parts: [{ text: this.options.systemInstruction }] }
                      : this.options.systemInstruction,
                }
              : {}),
            ...(this.options.tools && this.options.tools.length
              ? { tools: this.options.tools }
              : {}),
          },
        });
      } catch (err) {
        settleError(err);
      }
    });

    ws.addEventListener("message", (ev: MessageEvent) => {
      let msg: unknown;
      try {
        msg = JSON.parse(String(ev.data));
      } catch {
        return;
      }
      if (!isJsonObject(msg)) return;
      if (msg.setupComplete !== undefined) {
        this.cb.onSetupComplete?.();
        if (!settled) {
          settled = true;
          resolve();
        }
        return;
      }
      if (msg.error !== undefined) {
        settleError(new Error(`Live API error: ${JSON.stringify(msg.error)}`));
        return;
      }
      this.handleServerMessage(msg);
    });

    ws.addEventListener("error", () => {
      settleError(new Error("WebSocket error"));
    });

    ws.addEventListener("close", (ev: CloseEvent) => {
      settleError(new Error(`WebSocket closed (${ev.code})`));
    });

    this.setupDone = promise;
    return promise;
  }

  private handleServerMessage(msg: JsonObject): void {
    if (msg.serverContent !== undefined) {
      const event = extractServerContent(msg.serverContent);
      this.cb.onServerContent?.(event);
      const sc = msg.serverContent;
      if (isJsonObject(sc)) {
        if (sc.generationComplete === true || sc.turnComplete === true) {
          this.cb.onTurnComplete?.();
        }
      }
    }
    if (isJsonObject(msg.toolCall)) {
      const calls = msg.toolCall.functionCalls;
      if (Array.isArray(calls)) {
        for (const raw of calls) {
          if (!isJsonObject(raw)) continue;
          const id = asString(raw.id);
          const name = asString(raw.name);
          if (id === undefined || name === undefined) continue;
          const args = isJsonObject(raw.args) ? raw.args : {};
          this.cb.onToolCall?.({ id, name, args });
        }
      }
    }
  }

  send(obj: unknown): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("socket no abierto");
    }
    this.ws.send(JSON.stringify(obj));
  }

  sendText(text: string, turnComplete = true): void {
    this.send({
      clientContent: { turns: [{ role: "user", parts: [{ text }] }], turnComplete },
    });
  }

  /** Envía audio PCM16 (base64). La Live API espera 16 kHz PCM. */
  sendRealtimeAudio(pcmBase64: string, mimeType = "audio/pcm"): void {
    this.send({ realtimeInput: { audio: { data: pcmBase64, mimeType } } });
  }

  /** Marca fin del stream de audio (cuando la detección automática está activa). */
  endAudioStream(): void {
    this.send({ realtimeInput: { audioStreamEnd: true } });
  }

  respondToFunctionCall(id: string, result: unknown): void {
    this.send({ toolResponse: { functionResponses: [{ id, response: result }] } });
  }

  close(): void {
    this.ws?.close();
  }
}
