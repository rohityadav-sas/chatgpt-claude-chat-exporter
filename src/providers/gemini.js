import { extractBySelectors } from "../core/dom-adapter.js";
export const gemini = {
  id: "gemini",
  name: "Gemini",
  hosts: ["gemini.google.com"],
  extract: (document) =>
    extractBySelectors(document, [
      {
        selector: "main user-query, main model-response",
        role: (node) => (node.tagName === "USER-QUERY" ? "user" : "assistant"),
        body: (node) =>
          node.tagName === "USER-QUERY"
            ? node.querySelector(".query-text") || node
            : node.querySelector("message-content") ||
              node.querySelector(".markdown") ||
              node,
      },
      {
        selector: "main .query-text, main message-content",
        role: (node) => (node.matches(".query-text") ? "user" : "assistant"),
      },
    ]),
};
