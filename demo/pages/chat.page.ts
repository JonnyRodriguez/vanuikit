// demo/pages/chat.page.ts
/**
 * ChatPage — Showcase of the embedded `ChatWindow` + `createChat` hook,
 * backed by the kit's `openAIStream` transport against `/api/chat`
 * (OpenAI-compatible SSE, served by the demo server — see
 * server/routes/api/chat.route.ts).
 */
import { van, createChat, ChatWindow, EmptyState, Icon, openAIStream } from "vanuikit";
import { i18n } from "../shared/i18n.config.js";

const ChatPage = () => {
  const { div, h1, p } = van.tags;

  const chat = createChat({
    onStream: async (send) => {
      await openAIStream(chat.messages.val, send, {
        url: "/api/chat",
        model: "demo",
        apiKey: "demo",
      });
    },
  });

  return div(
    { class: "max-w-3xl mx-auto my-8 px-4 h-[78vh] flex flex-col" },
    div(
      { class: "mb-4" },
      h1({ class: "text-2xl font-bold text-foreground" }, i18n.t("chat.title", "Chat")),
      p(
        { class: "text-sm text-foreground-soft mt-1" },
        i18n.t(
          "chat.subtitle",
          "Embedded reactive chat — hook + component, agnostic of the AI transport.",
        ),
      ),
    ),
    div(
      { class: "flex-1 min-h-0" },
      ChatWindow({
        chat,
        emptyState: EmptyState({
          icon: Icon({ name: "inbox", class: "size-9" }),
          title: i18n.t("chat.emptyTitle", "No messages yet"),
          description: i18n.t(
            "chat.emptyDesc",
            "Write a message to see the simulated assistant stream its reply.",
          ),
        }),
      }),
    ),
  );
};

export { ChatPage };
