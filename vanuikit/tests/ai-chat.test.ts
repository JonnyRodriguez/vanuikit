import { describe, test, expect } from "bun:test";
import { openAIStream, createOpenAIChat } from "../src/ai-chat.js";

/**
 * Builds a Response whose body feeds the given SSE chunks verbatim.
 * Chunks may be strings (encoded to UTF-8 on enqueue) or raw Uint8Array
 * byte slices (for multi-byte split tests).
 */
const sseResponse = (chunks: Array<string | Uint8Array>) => {
  const stream = new ReadableStream({
    start(controller) {
      for (const c of chunks) {
        controller.enqueue(typeof c === "string" ? new TextEncoder().encode(c) : c);
      }
      controller.close();
    },
  });
  return new Response(stream, { status: 200 });
};

const OR_OPTS = {
  url: "https://openrouter.ai/api/v1/chat/completions",
  apiKey: "test-key",
  model: "liquid/lfm-2.5-24b-a2b",
};

describe("openAIStream", () => {
  test("streams text deltas from standard SSE frames", async () => {
    const chunks = [
      'data: {"choices":[{"delta":{"content":"Hel"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"lo"}}]}\n\n',
      "data: [DONE]\n\n",
    ];
    const original = globalThis.fetch;
    globalThis.fetch = (async () => sseResponse(chunks)) as typeof fetch;

    const got: string[] = [];
    try {
      await openAIStream([], (t) => got.push(t), OR_OPTS);
    } finally {
      globalThis.fetch = original;
    }
    expect(got.join("")).toBe("Hello");
  });

  test("handles multi-byte deltas split across chunk boundaries", async () => {
    // The '你' encodes as e4 bd a0 in UTF-8; split the SSE frame so a raw byte
    // boundary lands inside that multi-byte sequence. The
    // TextDecoder({ stream: true }) must reassemble it correctly.
    const frame = 'data: {"choices":[{"delta":{"content":"你"}}]}\n\n';
    const full = new TextEncoder().encode(
      'data: {"choices":[{"delta":{"content":"Hol"}}]}\n\n' + frame,
    );
    const splitAt = full.indexOf(0xe4) + 1; // after the e4 lead byte, before bd a0

    const chunks: Array<string | Uint8Array> = [
      full.subarray(0, splitAt),
      full.subarray(splitAt),
      "data: [DONE]\n\n",
    ];
    const original = globalThis.fetch;
    globalThis.fetch = (async () => sseResponse(chunks)) as typeof fetch;

    const got: string[] = [];
    try {
      await openAIStream([], (t) => got.push(t), OR_OPTS);
    } finally {
      globalThis.fetch = original;
    }
    expect(got.join("")).toBe("Hol你");
  });

  test("throws on non-OK response", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async () => new Response("nope", { status: 401 })) as typeof fetch;
    try {
      await expect(openAIStream([], () => {}, OR_OPTS)).rejects.toThrow(/401/);
    } finally {
      globalThis.fetch = original;
    }
  });

  test("surfaces upstream error bodies in the exception", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ error: { message: "no money" } }), { status: 402 })) as typeof fetch;
    try {
      await expect(openAIStream([], () => {}, OR_OPTS)).rejects.toThrow(/no money/);
    } finally {
      globalThis.fetch = original;
    }
  });
});

describe("createOpenAIChat", () => {
  test("produces a working ChatApi backed by the SSE transport", async () => {
    const chunks = [
      'data: {"choices":[{"delta":{"content":"Yes"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"."}}]}\n\n',
      "data: [DONE]\n\n",
    ];
    const original = globalThis.fetch;
    globalThis.fetch = (async () => sseResponse(chunks)) as typeof fetch;

    const chat = createOpenAIChat({ ...OR_OPTS });
    try {
      await chat.send("Do you have tickets?");
    } finally {
      globalThis.fetch = original;
    }

    expect(chat.messages.val.map((m) => [m.role, m.content])).toEqual([
      ["user", "Do you have tickets?"],
      ["assistant", "Yes."],
    ]);
  });
});
