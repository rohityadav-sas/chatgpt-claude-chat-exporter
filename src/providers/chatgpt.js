import { serializeMessage } from "../core/serialize.js";
import { messageIdentity } from "../core/identity.js";

export const chatgpt = {
  id: "chatgpt",
  name: "ChatGPT",
  hosts: ["chatgpt.com", "chat.openai.com"],
  extract(document) {
    return Array.from(
      document.querySelectorAll("main [data-message-author-role]"),
    )
      .filter(
        (node) => !node.parentElement.closest("[data-message-author-role]"),
      )
      .filter((node) =>
        ["user", "assistant"].includes(node.dataset.messageAuthorRole),
      )
      .map((node, index) => {
        const body =
          node.querySelector(".markdown, .whitespace-pre-wrap") || node;
        return {
          ...messageIdentity(node, node.dataset.messageAuthorRole, index),
          role: node.dataset.messageAuthorRole,
          ...serializeMessage(body),
        };
      })
      .filter((message) => message.markdown || message.text);
  },
};
