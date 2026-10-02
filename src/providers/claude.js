import { extractBySelectors } from "../core/dom-adapter.js";
export const claude = {
  id: "claude",
  name: "Claude",
  hosts: ["claude.ai"],
  extract: (document) =>
    extractBySelectors(document, [
      {
        selector:
          'main [data-testid="user-message"], main [data-testid="assistant-message"]',
        role: (node) =>
          node.dataset.testid === "user-message" ? "user" : "assistant",
        body: (node) => node.querySelector(".font-claude-response") || node,
      },
      {
        selector:
          'main [data-testid="user-message"], main .font-claude-response',
        role: (node) =>
          node.dataset.testid === "user-message" ? "user" : "assistant",
      },
    ]),
};
