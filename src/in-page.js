import { hasConversation } from "./core/conversation-presence.js";
import { findProvider } from "./providers/index.js";
import { findHeaderPlacement } from "./ui/header-placement.js";
import { createSignature, createExportPanel } from "./ui/in-page-panel.js";

// Observe SPA header replacement without modifying the site's history methods.
if (!globalThis.__aiChatExporterHeaderInstalled) {
  globalThis.__aiChatExporterHeaderInstalled = true;
  const provider = findProvider(location.href);
  if (provider) {
    const signature = createSignature(document);
    const panel = createExportPanel(document, signature, provider);
    let url = location.href;
    let scheduled = false;
    function reconcile() {
      scheduled = false;
      if (url !== location.href) {
        url = location.href;
        panel.reset();
      }
      const placement = hasConversation(document, provider.id) ? findHeaderPlacement(document, provider.id) : null;
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
