import { qwenTitle } from "../core/qwen-title.js";
import { reactProps, message, attachmentText } from "./shared.js";
export function readQwen() {
  const states = reactProps(".qwen-chat-message");
  const props = states.find((p) => Array.isArray(p.messages));
  if (!props) throw new Error("Qwen conversation state is unavailable.");
  return {
    title: qwenTitle(document, location.href, states),
    source: "page-state",
    messages: props.messages
      .map((m) =>
        message(
          m.id,
          m.role,
          [
            m.content ||
              (m.content_list || [])
                .filter((p) => p.phase === "answer")
                .map((p) => p.content)
                .join("\n\n"),
            attachmentText(m.files),
          ]
            .filter(Boolean)
            .join("\n\n"),
        ),
      )
      .filter(Boolean),
  };
}
export function readMistral() {
  const id = location.pathname.match(/\/(?:work|chat)\/([^/]+)/)?.[1];
  const props = reactProps("[data-message-author-role]").find(
    (p) => Array.isArray(p.messages) && (!p.chatId || p.chatId === id),
  );
  if (!props) throw new Error("Mistral conversation state is unavailable.");
  return {
    source: "page-state",
    messages: props.messages
      .map((m) =>
        message(
          m.id,
          m.role,
          [m.content, attachmentText(m.files)].filter(Boolean).join("\n\n"),
        ),
      )
      .filter(Boolean),
  };
}
