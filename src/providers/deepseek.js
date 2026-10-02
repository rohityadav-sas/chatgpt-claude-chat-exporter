import { extractBySelectors } from "../core/dom-adapter.js";
export const deepseek = {
  id: "deepseek",
  name: "DeepSeek",
  hosts: ["chat.deepseek.com"],
  extract: (document) =>
    extractBySelectors(document, [
      {
        selector: ".ds-message",
        role: (node) =>
          node.querySelector(".ds-assistant-message-main-content, .ds-markdown")
            ? "assistant"
            : "user",
        body: (node) =>
          node.querySelector(".ds-assistant-message-main-content") ||
          Array.from(node.querySelectorAll(".ds-markdown")).at(-1) ||
          node,
      },
      {
        selector: '[data-message-role="user"], [data-message-role="assistant"]',
        role: (node) => node.dataset.messageRole,
      },
    ]),
};
