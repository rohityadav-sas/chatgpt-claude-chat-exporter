import { extractBySelectors } from "../core/dom-adapter.js";
export const grok = {
  id: "grok",
  name: "Grok",
  hosts: ["grok.com"],
  extract: (document) =>
    extractBySelectors(document, [
      {
        selector:
          'main [data-testid="user-message"], main [data-testid="assistant-message"]',
        role: (node) =>
          node.dataset.testid === "user-message" ? "user" : "assistant",
        body: (node) => {
          const clone = node.cloneNode(true);
          clone
            .querySelectorAll(".thinking-container, .print\\:hidden")
            .forEach((item) => item.remove());
          return clone;
        },
      },
      {
        selector: "main .message-bubble",
        role: (node) =>
          node.className.includes("bg-surface-user-bubble")
            ? "user"
            : "assistant",
        body: (node) =>
          node.querySelector(".response-content-markdown") || node,
      },
    ]),
};
