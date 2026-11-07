import van, { type ChildDom, type State } from "vanjs-core";
import { cx } from "../util.js";
import { t } from "../i18n.js";
import { Button } from "./button.js";

const { div, span, textarea } = van.tags;

/**
 * =========================================================================
 * Chat — reactive chat UI + state hook (agnostic of any AI transport).
 *
 * The component and the hook know nothing about LLMs. `createChat` exposes
 * plain vans States; a transport (e.g. the AI SDK's `readDataStream`, or a
 * simple fetch/SSE) drives them through the `onStream` sink.
 * =========================================================================
 */

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  /** Epoch milliseconds when the message was produced. */
  ts?: number;
}

/** Pushes a chunk of assistant text while the stream is live. */
export type ChatStreamSink = (chunk: string) => void;

export interface CreateChatOptions {
  /**
   * Stream sink for the transport. It receives chunks as they arrive;
   * everything sent is treated as assistant text, accumulated in
   * `streamingText`, and committed as a message once the promise resolves.
   */
  onStream: (send: ChatStreamSink) => Promise<void>;
  /** Called when the transport throws; the error is also surfaced in `error`. */
  onError?: (error: unknown) => void;
}

export interface ChatApi {
  readonly messages: State<ChatMessage[]>;
  /** In-flight assistant text being streamed (not yet committed). */
  readonly streamingText: State<string>;
  readonly isLoading: State<boolean>;
  /** Last transport error, human-readable ("" when there is none). */
  readonly error: State<string>;
  /** Sends a message: commits a user message, then streams the assistant reply. */
  send(input: string): Promise<void>;
  /** Clears messages, streaming and error. */
  reset(): void;
}

let uidCounter = 0;
const uid = () => `msg_${Date.now().toString(36)}_${(uidCounter++).toString(36)}`;

/**
 * State hook for a chat conversation. Agnostic of the AI transport: the
 * caller wires `onStream` to whatever service produces the reply.
 */
export function createChat(opts: CreateChatOptions): ChatApi {
  const messages = van.state<ChatMessage[]>([]);
  const streamingText = van.state("");
  const isLoading = van.state(false);
  const error = van.state("");

  async function send(input: string) {
    const text = input.trim();
    if (!text || isLoading.val) return;

    messages.val = [...messages.val, { id: uid(), role: "user", content: text, ts: Date.now() }];
    streamingText.val = "";
    error.val = "";
    isLoading.val = true;

    try {
      await opts.onStream((chunk) => {
        if (chunk) streamingText.val += chunk;
      });
    } catch (e) {
      error.val = e instanceof Error ? e.message : String(e);
      opts.onError?.(e);
    } finally {
      const partial = streamingText.val;
      streamingText.val = "";
      isLoading.val = false;
      if (partial) {
        messages.val = [
          ...messages.val,
          { id: uid(), role: "assistant", content: partial, ts: Date.now() },
        ];
      }
    }
  }

  function reset() {
    messages.val = [];
    streamingText.val = "";
    error.val = "";
    isLoading.val = false;
  }

  return { messages, streamingText, isLoading, error, send, reset };
}

export interface ChatWindowProps {
  chat: ChatApi;
  /** Optional content rendered above the message list (e.g. a header row). */
  extra?: ChildDom;
  disabled?: boolean | State<boolean>;
  /** Snap the scroller to the bottom as new content arrives. Default: true. */
  autoScroll?: boolean;
  /** Shown when there are no messages yet (e.g. an EmptyState). */
  emptyState?: ChildDom;
  /** Fires right after a message is submitted (before the reply streams). */
  onSend?: (input: string) => void;
  class?: string;
  [key: string]: any;
}

/**
 * Presentational chat window: message list, live streaming bubble and a
 * composer. Renders plainly `ChatApi` States — no AI coupling. Reactive
 * i18n labels are hoisted (never inside function children) per the kit rules.
 */
export function ChatWindow(props: ChatWindowProps) {
  const inputVal = van.state("");
  const autoScroll = props.autoScroll ?? true;

  // Hoisted i18n: State<string> consumed directly by props (never in bindings).
  const sendLabel = t("chat.send", "Send");
  const placeholderText = t("chat.placeholder", "Write a message…");
  const inputLabel = t("chat.inputLabel", "Message");

  const scrollerId = `vui-chat-scroller-${uid()}`;

  const isDisabled = (v?: boolean | State<boolean>) =>
    typeof v === "object" && v !== null ? v.val : !!v;

  const isSendDisabled = () =>
    isDisabled(props.disabled) ||
    props.chat.isLoading.val ||
    !inputVal.val.trim();

  const submit = () => {
    const text = inputVal.val.trim();
    if (!text || isSendDisabled()) return;
    props.chat.send(text).then(() => {
      inputVal.val = "";
    }).catch(() => {
      /* error surfaced via chat.error */
    });
    props.onSend?.(text);
  };

  const renderMessage = (m: ChatMessage) => {
    const isUser = m.role === "user";
    return div(
      { class: cx("flex w-full", isUser ? "justify-end" : "justify-start") },
      div(
        {
          class: cx(
            "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words shadow-sm",
            isUser
              ? "bg-primary text-primary-fg rounded-br-sm"
              : "bg-secondary/60 text-foreground rounded-bl-sm border border-border",
          ),
        },
        m.content,
      ),
    );
  };

  const renderStreaming = () => {
    if (!props.chat.streamingText.val) return null;
    return div(
      { class: "flex w-full justify-start", "aria-live": "polite" },
      div(
        {
          class:
            "max-w-[80%] rounded-2xl rounded-bl-sm px-3.5 py-2 text-sm whitespace-pre-wrap break-words bg-secondary/60 text-foreground border border-border",
        },
        props.chat.streamingText.val,
        span({
          class: "inline-block w-1.5 h-4 ml-0.5 align-middle bg-accent animate-pulse rounded-sm",
        }),
      ),
    );
  };

  // Autoscroll: react to new content, then snap the scroller to the bottom.
  if (typeof document !== "undefined" && autoScroll) {
    van.derive(() => {
      props.chat.messages.val;
      props.chat.streamingText.val;
      if (typeof requestAnimationFrame === "function") {
        const scroller = document.getElementById(scrollerId);
        if (scroller) {
          requestAnimationFrame(() => {
            scroller.scrollTop = scroller.scrollHeight;
          });
        }
      }
    });
  }

  return div(
    {
      class: cx(
        "flex flex-col h-full min-h-0 rounded-xl border border-border bg-card overflow-hidden",
        props.class,
      ),
    },
    props.extra ?? null,
    div(
      {
        id: scrollerId,
        class: "flex-1 min-h-0 overflow-y-auto",
      },
      () =>
        div(
          { class: "flex flex-col gap-2 p-4" },
          props.chat.messages.val.length === 0 && !props.chat.streamingText.val
            ? (props.emptyState ?? null)
            : [
                ...props.chat.messages.val.map(renderMessage),
                props.chat.streamingText.val ? renderStreaming() : null,
              ].filter(Boolean),
        ),
    ),
    div(
      { class: "border-t border-border p-3" },
      div(
        { class: "flex items-end gap-2" },
        textarea(
          {
            rows: 1,
            value: () => inputVal.val,
            "aria-label": inputLabel,
            placeholder: placeholderText,
            class:
              "flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:ring-1 focus:ring-focus",
            oninput: (e: Event) => {
              inputVal.val = (e.currentTarget as HTMLTextAreaElement).value;
            },
            onkeydown: (e: KeyboardEvent) => {
              if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
                e.preventDefault();
                submit();
              }
            },
          },
        ),
        Button({ disabled: isSendDisabled, onclick: submit }, sendLabel),
      ),
    ),
  );
}
