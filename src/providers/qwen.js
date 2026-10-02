import { extractBySelectors } from "../core/dom-adapter.js";
export const qwen = {
  id: "qwen",
  name: "Qwen",
  hosts: ["chat.qwen.ai", "chat.qwenlm.ai"],
  extract: (document) =>
    extractBySelectors(document, [
      {
        selector: ".chat-user-message-container, .qwen-chat-message-assistant",
        role: (node) =>
          node.matches(".chat-user-message-container") ? "user" : "assistant",
        body: (node) =>
          node.querySelector(
            ".chat-user-message, .qwen-markdown, .markdown-body, .message-content",
          ) || node,
      },
      {
        selector: ".qwen-chat-message-user, .qwen-chat-message-assistant",
        role: (node) =>
          node.matches(".qwen-chat-message-user") ? "user" : "assistant",
        body: (node) =>
          node.querySelector(
            ".qwen-markdown, .markdown-body, .message-content",
          ) || node,
      },
      {
        selector:
          'main [data-message-role="user"], main [data-message-role="assistant"]',
        role: (node) => node.dataset.messageRole,
      },
    ]),
};
