import { extractBySelectors } from "../core/dom-adapter.js";
export const mistral = {
  id: "mistral",
  name: "Mistral",
  hosts: ["chat.mistral.ai"],
  extract: (document) =>
    extractBySelectors(document, [
      {
        selector:
          '[data-message-author-role="user"], [data-message-author-role="assistant"]',
        role: (node) => node.dataset.messageAuthorRole,
        body: (node) =>
          node.querySelector('[data-message-part-type="answer"]') ||
          node.querySelector(".markdown-container-style") ||
          node,
      },
      {
        selector: '[data-message-role="user"], [data-message-role="assistant"]',
        role: (node) => node.dataset.messageRole,
      },
    ]),
};
