import { serializeMessage } from "./serialize.js";
import { messageIdentity } from "./identity.js";

// Ordered selector strategies: stable attributes first, presentation fallbacks last.
// Pick one strategy per page to prevent duplicate extraction across layouts.
export function extractBySelectors(document, strategies) {
  for (const strategy of strategies) {
    const nodes = Array.from(document.querySelectorAll(strategy.selector));
    if (!nodes.length) continue;
    const messages = nodes
      .filter(
        (node) =>
          !nodes.some((other) => other !== node && other.contains(node)),
      )
      .map((node, index) => {
        const role = strategy.role(node);
        if (!["user", "assistant"].includes(role)) return null;
        const body = strategy.body?.(node) || node;
        return {
          ...messageIdentity(node, role, index),
          role,
          ...serializeMessage(body),
        };
      })
      .filter((message) => message && (message.markdown || message.text));
    if (messages.length) return messages;
  }
  return [];
}
