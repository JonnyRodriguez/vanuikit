/**
 * ai-chat.ts — Minimal streaming transport for `createChat` against any
 * OpenAI-compatible `POST /chat/completions` endpoint (OpenRouter, DeepInfra,
 * vLLM, ollama, …).
 *
 * Zero dependencies: plain `fetch` + `ReadableStream` (WHATWG). This is the
 * "transport" half of the chat stack; the UI half is `ChatWindow`/`createChat`.
 *
 * Coordinates:
 *   - `openAIStream(...)` fetches the endpoint with `stream: true` and drives
 *     a `ChatStreamSink` callback chunk by chunk as deltas arrive.
 *   - `createOpenAIChat(opts)` wires that stream into `createChat` for you,
 *     returning a ready `ChatApi`.
 */

import { createChat, type ChatApi, type ChatMessage, type ChatStreamSink } from "./components/chat.js";

export interface OpenAIChatOptions {
  /** Full URL of the chat completions endpoint (e.g. `https://openrouter.ai/api/v1/chat/completions`). */
  url: string;
  /** Bearer token for the provider. */
  apiKey: string;
  /** Model id as known by the provider (e.g. `liquid/lfm-2.5-24b-a2b`). */
  model: string;
  /** Optional system prompt prepended to the conversation. */
  system?: string;
  temperature?: number;
  maxTokens?: number;
  /** Extra headers (default: `Content-Type` + `Authorization`). */
  headers?: Record<string, string>;
}

export interface CreateOpenAIChatOptions extends OpenAIChatOptions {
  /** Echoed through to `createChat`; fired when the transport/HTTP call throws. */
  onError?: (error: unknown) => void;
}

const uid = () => `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const trim = (s: string) => s.trim();

/**
 * Streams a single assistant response from an OpenAI-compatible endpoint.
 *
 * @param messages Full conversation so far (user/assistant); the endpoint
 *   receives them as the chat history.
 * @param send Sink receiving each text delta as it is decoded.
 */
export async function openAIStream(
  messages: ChatMessage[],
  send: ChatStreamSink,
  opts: OpenAIChatOptions,
): Promise<void> {
  const { url, apiKey, model } = opts;
  if (!apiKey || !model) throw new Error("openAIStream: apiKey and model are required");

  const body: Record<string, unknown> = {
    model,
    stream: true,
    messages: [
      ...(opts.system ? [{ role: "system" as const, content: opts.system }] : []),
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  };
  if (typeof opts.temperature === "number") body.temperature = opts.temperature;
  if (typeof opts.maxTokens === "number") body.max_tokens = opts.maxTokens;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...opts.headers,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`chat completions ${res.status}: ${detail.slice(0, 200) || res.statusText}`);
  }
  if (!res.body) throw new Error("chat completions: empty response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by a blank line. A trailing line without a
    // newline may be split mid multi-byte character; leave it buffered.
    let sep = buffer.indexOf("\n\n");
    while (sep !== -1) {
      const rawEvent = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const dataLine = rawEvent.split("\n").find((l) => l.startsWith("data:"));
      if (!dataLine) { sep = buffer.indexOf("\n\n"); continue; }

      const data = dataLine.slice("data:".length).trim();
      if (!data || data === "[DONE]") { sep = buffer.indexOf("\n\n"); continue; }

      let json: any;
      try {
        json = JSON.parse(data);
      } catch {
        // Partial JSON (rare, but possible if a chunk ends mid-object).
        sep = buffer.indexOf("\n\n"); continue;
      }

      const delta = json?.choices?.[0]?.delta?.content;
      if (typeof delta === "string" && delta) send(delta);
      sep = buffer.indexOf("\n\n");
    }
  }
}

/**
 * Returns a `ChatApi` whose transport streams from an OpenAI-compatible
 * endpoint. Drop-in for `createChat(...)` in new code, or pair with
 * `openAIStream` (plus `createChat`) for full control.
 */
export function createOpenAIChat(opts: CreateOpenAIChatOptions): ChatApi {
  const chat = createChat({
    onStream: async (send) => {
      await openAIStream(chat.messages.val, send, opts);
    },
    onError: opts.onError,
  });
  return chat;
}

export type { ChatApi, ChatMessage };
