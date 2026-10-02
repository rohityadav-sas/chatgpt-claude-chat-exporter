import { extractBySelectors } from "../core/dom-adapter.js";
export const perplexity = {
  id: "perplexity",
  name: "Perplexity",
  hosts: ["www.perplexity.ai", "perplexity.ai"],
  extract: (document) =>
    extractBySelectors(document, [
      {
        selector: 'main [data-renderer="lm"]',
        role: (node) =>
          node.classList.contains("prose") ? "assistant" : "user",
      },
      {
        selector:
          'main [data-testid="user-message"], main [data-testid="assistant-message"]',
        role: (node) =>
          node.dataset.testid === "user-message" ? "user" : "assistant",
      },
    ]),
};
