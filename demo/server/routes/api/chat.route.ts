// server/routes/api/chat.route.ts
/**
 * Chat Route — SSE streaming endpoint for the embedded `ChatWindow`.
 *
 * The demo serves an OpenAI-compatible SSE stream (same wire format the
 * client's `openAIStream` consumes). When `OPENROUTER_API_KEY` is configured,
 * it proxies to OpenRouter's `/chat/completions` with `stream: true`;
 * otherwise it emits a simulated reply so the demo works without creds.
 *
 * Swap the provider here (OpenRouter → DeepInfra/…) by pointing `PROVIDER_URL`
 * and `MODEL` at another OpenAI-compatible endpoint — the client code does
 * not change.
 */
import { Hono } from "hono";
import { stream } from "hono/streaming";
import type { ChatMessage } from "vanuikit";

const chatRoute = new Hono();

const PROVIDER_URL = process.env.OPENROUTER_API_KEY
  ? process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1/chat/completions"
  : null;
const MODEL = process.env.OPENROUTER_CHAT_MODEL ?? "liquid/lfm-2.5-24b-a2b";

const sseFrame = (payload: unknown) => `data: ${JSON.stringify(payload)}\n\n`;

/** Simulated assistant reply, streamed chunk by chunk (no creds). */
function* simulatedReply(question: string): Generator<string> {
  const reply =
    `Simulated assistant reply to “${question}”. Configura OPENROUTER_API_KEY ` +
    "en el `.env` del server para recibir respuestas reales (OpenRouter/DeepInfra).";
  for (const ch of reply) yield ch;
}

chatRoute.post("/", async (c) => {
  const body = await c.req.json().catch(() => ({ messages: [] as ChatMessage[] }));
  const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : [];
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  return stream(c, async (stream) => {
    const send = (chunk: string) => stream.write(sseFrame({ choices: [{ delta: { content: chunk } }] }));

    try {
      if (PROVIDER_URL) {
        // Real provider (OpenAI-compatible). Pass the full history through.
        const res = await fetch(PROVIDER_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          },
          body: JSON.stringify({
            model: MODEL,
            stream: true,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          throw new Error(`upstream ${res.status}: ${detail.slice(0, 200)}`);
        }
        if (!res.body) throw new Error("upstream: empty body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let sep = buffer.indexOf("\n\n");
          while (sep !== -1) {
            const rawEvent = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);
            const dataLine = rawEvent.split("\n").find((l) => l.startsWith("data:"));
            if (dataLine) {
              const data = dataLine.slice(5).trim();
              if (data && data !== "[DONE]") await stream.write(`data: ${data}\n\n`);
            }
            sep = buffer.indexOf("\n\n");
          }
        }
      } else {
        for (const chunk of simulatedReply(lastUser)) {
          send(chunk);
          await stream.sleep(12);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await stream.write(sseFrame({ error: { message: msg } }));
    }
  });
});

export default chatRoute;

// Deny-by-default: the chat endpoint is PUBLIC (the demo calls it without a
// session). In a real deployment, remove this line to protect it.
export const meta = { public: true };
