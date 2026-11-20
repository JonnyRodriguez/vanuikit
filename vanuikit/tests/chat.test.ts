import { describe, test, expect } from "bun:test";
import { createChat, ChatWindow } from "../src/components/chat.js";

const flush = () => new Promise<void>((r) => setTimeout(r, 10));
const mount = (node: HTMLElement) => {
  document.body.replaceChildren(node);
  return node;
};

describe("createChat", () => {
  test("send() commits a user message then streams the assistant reply", async () => {
    const chat = createChat({
      onStream: async (send) => {
        send("Hel");
        send("lo");
      },
    });
    await chat.send("hi");

    expect(chat.messages.val.map((m) => [m.role, m.content])).toEqual([
      ["user", "hi"],
      ["assistant", "Hello"],
    ]);
    expect(chat.streamingText.val).toBe("");
    expect(chat.isLoading.val).toBe(false);
  });

  test("streamingText accumulates during the transport and is committed at the end", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => { release = r; });
    const chat = createChat({
      onStream: async (send) => {
        send("a");
        await gate; // hold the stream open until the test allows it to finish
        send("b");
      },
    });
    const p = chat.send("x");

    expect(chat.streamingText.val).toBe("a");
    expect(chat.isLoading.val).toBe(true);
    expect(chat.messages.val[0].role).toBe("user");

    release();
    await p;
    expect(chat.streamingText.val).toBe("");
    expect(chat.messages.val[1].content).toBe("ab");
  });

  test("trimmed/empty input is ignored", async () => {
    let calls = 0;
    const chat = createChat({ onStream: async () => { calls++; } });
    await chat.send("   ");
    expect(calls).toBe(0);
    expect(chat.messages.val.length).toBe(0);
  });

  test("errors surface in the error State and onError", async () => {
    let seen: unknown;
    const chat = createChat({
      onStream: async () => { throw new Error("boom"); },
      onError: (e) => { seen = e; },
    });
    await chat.send("hi");

    expect(chat.error.val).toBe("boom");
    expect(seen).toBeInstanceOf(Error);
    expect(chat.isLoading.val).toBe(false);
    // only the user message is kept — no assistant partial
    expect(chat.messages.val.map((m) => m.role)).toEqual(["user"]);
  });

  test("reset clears all state", async () => {
    const chat = createChat({ onStream: async (send) => send("ok") });
    await chat.send("hi");

    chat.reset();
    expect(chat.messages.val).toEqual([]);
    expect(chat.streamingText.val).toBe("");
    expect(chat.error.val).toBe("");
    expect(chat.isLoading.val).toBe(false);
  });
});

describe("ChatWindow", () => {
  test("renders messages with user/assistant bubbles", () => {
    const chat = createChat({ onStream: async () => {} });
    chat.messages.val = [
      { id: "1", role: "user", content: "hello" },
      { id: "2", role: "assistant", content: "how's it going" },
    ];
    const el = mount(ChatWindow({ chat, autoScroll: false }) as HTMLElement);

    expect(el.textContent).toContain("hello");
    expect(el.textContent).toContain("how's it going");
    expect(el.querySelectorAll("[class*='rounded-2xl']").length).toBe(2);
  });

  test("composer sends via clicking Send and clears the box", async () => {
    const chat = createChat({ onStream: async (send) => send("reply") });
    const el = mount(ChatWindow({ chat, autoScroll: false }) as HTMLElement);

    const ta = el.querySelector("textarea") as HTMLTextAreaElement;
    ta.value = "question";
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    await flush();

    const sendBtn = Array.from(el.querySelectorAll("button")).find((b) =>
      b.textContent.trim() === "Send",
    )!;
    expect(sendBtn).toBeTruthy();
    sendBtn.click();
    await flush();

    expect(chat.messages.val.map((m) => [m.role, m.content])).toEqual([
      ["user", "question"],
      ["assistant", "reply"],
    ]);
    expect((el.querySelector("textarea") as HTMLTextAreaElement).value).toBe("");
  });

  test("Enter sends; Shift+Enter adds a newline instead", async () => {
    const chat = createChat({ onStream: async () => {} });
    const el = mount(ChatWindow({ chat, autoScroll: false }) as HTMLElement);
    const ta = el.querySelector("textarea") as HTMLTextAreaElement;

    ta.value = "with enter";
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    await flush();

    ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await flush();
    expect(chat.messages.val.length).toBe(1);
    expect(chat.messages.val[0].content).toBe("with enter");

    ta.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", shiftKey: true, bubbles: true }),
    );
    await flush();
    expect(chat.messages.val.length).toBe(1);
  });

  test("Send is disabled when the input is empty", async () => {
    const chat = createChat({ onStream: async (send) => send("x") });
    const el = mount(ChatWindow({ chat, autoScroll: false }) as HTMLElement);
    const sendBtn = () =>
      Array.from(el.querySelectorAll("button")).find((b) =>
        b.textContent.trim() === "Send",
      )! as HTMLButtonElement;

    expect(sendBtn().disabled).toBe(true);

    const ta = el.querySelector("textarea") as HTMLTextAreaElement;
    ta.value = "text";
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    await flush();
    expect(sendBtn().disabled).toBe(false);
  });
});
