// Each provider owns a real conversation-header location. Never fall back to a
// floating page corner or a message-level Share button.
function directChild(container, descendant) {
  let node = descendant;
  while (node && node.parentElement !== container) node = node.parentElement;
  return node;
}

function visibleHeader(node, document) {
  if (!node) return false;
  const rect = node.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.top >= -8 &&
    rect.top < 120 &&
    rect.right > document.defaultView.innerWidth * 0.55
  );
}

function before(container, reference, document) {
  if (!container || !visibleHeader(reference || container, document))
    return null;
  return { container, before: reference || container.firstChild };
}

export function findHeaderPlacement(document, provider) {
  const query = (selector) => document.querySelector(selector);
  switch (provider) {
    case "claude": {
      const group = query('main [data-testid="wiggle-controls-actions-group"]');
      return before(
        group,
        Array.from(group?.children || []).find(
          (node) => !node.hasAttribute("data-ai-chat-exporter"),
        ),
        document,
      );
    }
    case "chatgpt": {
      const group = query('[data-testid="thread-header-right-actions"]');
      const share = query('#page-header [data-testid="share-chat-button"]');
      return before(group, directChild(group, share), document);
    }
    case "grok": {
      const share = query('main button[aria-label="Create share link"]');
      return before(
        share?.parentElement,
        share?.parentElement.firstChild,
        document,
      );
    }
    case "deepseek": {
      const group = query("._2be88ba");
      const actions = Array.from(group?.children || []).find(
        (node) =>
          node.getAttribute("role") === "button" &&
          visibleHeader(node, document),
      );
      return before(group, actions, document);
    }
    case "gemini": {
      const actions = query("conversation-actions-icon");
      return before(actions?.parentElement, actions, document);
    }
    case "qwen": {
      const group = query("#qwen-chat-header-right");
      return before(
        group,
        Array.from(group?.children || []).find(
          (node) => !node.hasAttribute("data-ai-chat-exporter"),
        ),
        document,
      );
    }
    case "perplexity": {
      const menu = query('main button[aria-label="Session actions"]');
      const group = menu?.parentElement.parentElement;
      return before(group, directChild(group, menu), document);
    }
    case "mistral": {
      const header = query(".app-shell-top-bar-0");
      const group = Array.from(header?.children || [])
        .reverse()
        .find(
          (node) =>
            node.querySelector("button") && visibleHeader(node, document),
        );
      return before(
        group,
        Array.from(group?.children || []).find(
          (node) => !node.hasAttribute("data-ai-chat-exporter"),
        ),
        document,
      );
    }
    default:
      return null;
  }
}
