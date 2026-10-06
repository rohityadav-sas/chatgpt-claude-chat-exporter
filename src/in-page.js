import { hasConversation } from "./core/conversation-presence.js";
import { findProvider } from "./providers/index.js";
import { findHeaderPlacement } from "./ui/header-placement.js";
import { createSignature, createExportPanel } from "./ui/in-page-panel.js";

const debugPrefix = "[AI Chat Exporter]";
function describe(node) {
  if (!node) return null;
  const rect = node.getBoundingClientRect();
  return { tag: node.tagName, id: node.id, testId: node.getAttribute("data-testid"),
    ariaLabel: node.getAttribute("aria-label"),
    rect: { top: rect.top, right: rect.right, width: rect.width, height: rect.height } };
}
console.info(debugPrefix, "content script started", {
  version: __EXPORTER_BUILD_VERSION__, host: location.hostname,
  readyState: document.readyState, viewportWidth: innerWidth,
  alreadyInstalled: Boolean(globalThis.__aiChatExporterHeaderInstalled),
});

// Observe SPA header replacement without modifying the site's history methods.
try {
if (!globalThis.__aiChatExporterHeaderInstalled) {
  globalThis.__aiChatExporterHeaderInstalled = true;
  const provider = findProvider(location.href);
  if (provider) {
    const signature = createSignature(document);
    const panel = createExportPanel(document, signature, provider);
    let url = location.href;
    let scheduled = false;
    let lastDebugState = "";
    const debugEnabled = provider.id === "chatgpt" && /Firefox\//.test(navigator.userAgent);
    let lastDebugTime = -Infinity;
    function reconcile() {
      scheduled = false;
      try {
      if (url !== location.href) {
        url = location.href;
        panel.reset();
      }
      const conversation = Boolean(hasConversation(document, provider.id));
      const placement = conversation ? findHeaderPlacement(document, provider.id) : null;
      if (debugEnabled && performance.now() - lastDebugTime > 3000) {
      lastDebugTime = performance.now();
      const state = {
        provider: provider.id, conversation, placement: Boolean(placement),
        container: describe(placement?.container), before: describe(placement?.before),
        authorNodes: document.querySelectorAll('[data-message-author-role]').length,
        turnNodes: document.querySelectorAll('[data-testid^="conversation-turn"], article[data-turn]').length,
        shareCandidates: Array.from(document.querySelectorAll('button, [role="button"]'))
          .filter(node => node.getAttribute("data-testid") === "share-chat-button" ||
            /^(share|share chat|share conversation)$/i.test(node.getAttribute("aria-label") || node.textContent.trim()))
          .map(describe),
        viewportWidth: innerWidth,
      };
      const serialized = JSON.stringify(state);
      if (serialized !== lastDebugState) {
        console.info(debugPrefix, "header detection", serialized);
        lastDebugState = serialized;
      }
      }
      if (
        placement &&
        placement.before !== signature.host &&
        (signature.host.parentElement !== placement.container ||
          signature.host.nextSibling !== placement.before)
      )
        placement.container.insertBefore(signature.host, placement.before);
      if (!placement && signature.host.isConnected) {
        signature.host.remove();
        panel.hide({ focus: false });
      }
      const dark =
        document.documentElement.classList.contains("dark") ||
        document.body.classList.contains("dark") ||
        document.documentElement.dataset.theme === "dark" ||
        document.documentElement.getAttribute("data-color-mode") === "dark" ||
        document.documentElement.getAttribute("data-color-scheme") === "dark";
      const theme = dark ? "dark" : "light";
      if (signature.host.dataset.theme !== theme) {
        signature.host.dataset.theme = theme;
        panel.host.dataset.theme = theme;
      }
      } catch (error) {
        const failure = String(error?.stack || error);
        if (failure !== lastDebugState) console.error(debugPrefix, "header reconciliation failed", failure);
        lastDebugState = failure;
      }
    }
    function schedule() {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(reconcile);
      }
    }
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    const interval = setInterval(schedule, 700);
    window.addEventListener(
      "pagehide",
      () => {
        observer.disconnect();
        clearInterval(interval);
      },
      { once: true },
    );
    reconcile();
  }
}
} catch (error) {
  globalThis.__aiChatExporterHeaderInstalled = false;
  console.error(debugPrefix, "initialization failed", String(error?.stack || error));
}
