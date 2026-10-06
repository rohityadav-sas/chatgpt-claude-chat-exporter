import { writeClipboard } from "./core/clipboard.js";
import logoSvg from "../assets/icon.svg";
import { createExport } from "./core/formats.js";
import { findProvider } from "./providers/index.js";
const scriptDirectory = new URL(".", self.location.href).pathname.slice(1);
async function requireConversationTab(sender, url) {
  if (
    sender.id !== chrome.runtime.id ||
    !sender.tab ||
    !findProvider(sender.url)
  )
    throw new Error("Requests must come from a supported conversation.");
  // A content script's sender.url can retain the URL before SPA navigation.
  const tab = await chrome.tabs.get(sender.tab.id);
  if (
    !findProvider(tab.url) ||
    tab.url !== url ||
    new URL(tab.url).origin !== new URL(sender.url).origin
  )
    throw new Error("The conversation changed. Extract it again.");
  return tab;
}

const pdfJobs = new Map();
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type === "ai-chat-exporter:pdf-progress") {
    if (
      sender.id !== chrome.runtime.id ||
      sender.url !== chrome.runtime.getURL(scriptDirectory + "pdf.html")
    )
      return false;
    const job = pdfJobs.get(message.requestId);
    if (job?.tabId)
      chrome.tabs
        .sendMessage(job.tabId, { ...message, requestId: job.clientId })
        .catch(() => {});
    return false;
  }
  if (message?.type === "ai-chat-exporter:copy-conversation") {
    (async () => {
      const fromPopup =
        sender.id === chrome.runtime.id &&
        sender.url === chrome.runtime.getURL(`${scriptDirectory}popup.html`);
      if (!fromPopup) await requireConversationTab(sender, message.url);
      if (typeof message.text !== "string")
        throw Error("Invalid clipboard content.");
      return await writeClipboard(message.text, ensureToolsDocument);
    })().then(respond, (error) => respond({ error: error.message }));
    return true;
  }
  if (message?.type === "ai-chat-exporter:read-direct") {
    (async () => {
      await requireConversationTab(sender, message.url);
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        world: "MAIN",
        files: [`${scriptDirectory}direct.js`],
      });
      const data = result?.result;
      if (data?.conversation && data.conversation.url !== message.url)
        throw new Error("The conversation changed. Extract it again.");
      return data || { error: "Conversation data is unavailable." };
    })().then(respond, (error) => respond({ error: error.message }));
    return true;
  }
  // Tabs open during an update may still send the previous PDF message.
  if (
    !["ai-chat-exporter:download-pdf", "ai-chat-exporter:open-pdf"].includes(
      message?.type,
    )
  )
    return false;
  (async () => {
    const chat = message.conversation;
    const fromPopup =
      sender.id === chrome.runtime.id &&
      sender.url === chrome.runtime.getURL(`${scriptDirectory}popup.html`);
    if (!fromPopup) await requireConversationTab(sender, chat?.url);
    if (!chat || !Array.isArray(chat.messages) || !chat.messages.length)
      throw new Error("The conversation changed. Extract it again.");
    await ensurePdfDocument();
    const requestId = crypto.randomUUID();
    const clientId = message.requestId;
    pdfJobs.set(requestId, { tabId: sender.tab?.id, clientId });
    let timeout;
    const result = await Promise.race([
      chrome.runtime.sendMessage({
        type: "ai-chat-exporter:render-pdf",
        conversation: chat,
        requestId,
        clientId,
      }),
      new Promise((_, reject) => {
        timeout = setTimeout(
          () =>
            reject(
              new Error(
                "PDF generation timed out. Reload the extension and try again.",
              ),
            ),
          30000,
        );
      }),
    ]).finally(() => {
      clearTimeout(timeout);
      pdfJobs.delete(requestId);
    });
    if (!result?.url)
      throw new Error(result?.error || "PDF generation failed.");
    const { filename } = createExport(chat, "txt");
    await chrome.downloads.download({
      url: result.url,
      filename: filename.replace(/\.txt$/, ".pdf"),
      saveAs: false,
    });
    return { success: true, elapsedMs: result.elapsedMs };
  })().then(respond, (error) => respond({ error: error.message }));
  return true;
});

let creatingPdfDocument;
async function ensurePdfDocument() {
  await ensureToolsDocument();
  const result = await chrome.runtime.sendMessage({
    type: "ai-chat-exporter:prepare-pdf",
  });
  if (!result?.success) throw Error(result?.error || "PDF module unavailable.");
}
async function ensureToolsDocument() {
  // Firefox event pages have a DOM but no chrome.offscreen API.
  // Keep the tools in a separate extension frame so runtime messages reach it.
  if (!chrome.offscreen) {
    if (!creatingPdfDocument)
      creatingPdfDocument = new Promise((resolve, reject) => {
        const frame = document.createElement("iframe");
        frame.hidden = true;
        frame.src = chrome.runtime.getURL(scriptDirectory + "pdf.html");
        frame.onload = resolve;
        frame.onerror = () => reject(Error("Export tools could not load."));
        document.body.append(frame);
      }).catch((error) => {
        creatingPdfDocument = undefined;
        throw error;
      });
    await creatingPdfDocument;
    return;
  }
  if (await chrome.offscreen.hasDocument()) return;
  if (!creatingPdfDocument)
    creatingPdfDocument = chrome.offscreen
      .createDocument({
        url: chrome.runtime.getURL(scriptDirectory + "pdf.html"),
        reasons: ["BLOBS", "CLIPBOARD"],
        justification:
          "Render selected conversation messages locally and download their PDF.",
      })
      .finally(() => {
        creatingPdfDocument = undefined;
      });
  await creatingPdfDocument;
}

const websiteMenu = "copy-website-markdown";
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() =>
    chrome.contextMenus.create({
      id: websiteMenu,
      title: "Copy website as Markdown",
      contexts: ["all"],
      documentUrlPatterns: ["http://*/*", "https://*/*"],
    }),
  );
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === websiteMenu && tab?.id) copyWebsite(tab.id);
});
async function copyWebsite(tabId) {
  try {
    const [capture] = await chrome.scripting.executeScript({
      target: { tabId },
      files: [scriptDirectory + "website.js"],
    });
    const data = capture?.result;
    if (!data?.markdown)
      throw Error(data?.error || "This browser page cannot be copied.");
    const result = await writeClipboard(data.markdown, ensureToolsDocument);
    if (!result?.success)
      throw Error(result?.error || "Clipboard copy failed.");
    await chrome.action.setBadgeText({ tabId, text: "" });
    await showWebsiteStatus(tabId, "Markdown copied", false);
  } catch (error) {
    await showWebsiteStatus(tabId, error.message, true).catch(async () => {
      await chrome.action.setBadgeText({ tabId, text: "!" });
      await chrome.action.setTitle({ tabId, title: error.message });
    });
  }
}
async function showWebsiteStatus(tabId, text, error) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: (text, error, logoSvg) => {
      document
        .querySelector('[data-ai-chat-exporter="website-toast"]')
        ?.remove();
      const host = document.createElement("div");
      host.dataset.aiChatExporter = "website-toast";
      host.style.cssText =
        "position:fixed;right:20px;top:20px;z-index:2147483647;pointer-events:none";
      const shadow = host.attachShadow({ mode: "closed" });
      const label = document.createElement("div");
      const logo = new DOMParser().parseFromString(
        logoSvg,
        "image/svg+xml",
      ).documentElement;
      logo.setAttribute("width", "28");
      logo.setAttribute("height", "28");
      logo.setAttribute("aria-hidden", "true");
      logo.style.cssText =
        "flex:none;border-radius:7px;box-shadow:0 0 0 1px #ffffff30";
      const content = document.createElement("div");
      content.style.cssText = "display:grid;gap:3px;min-width:0";
      const message = document.createElement("span");
      message.textContent = text;
      message.style.cssText =
        "font-size:13px;font-weight:600;line-height:1.3;color:#25362d";
      const subtitle = document.createElement("span");
      subtitle.textContent = error ? "Please try again" : "Ready to paste";
      subtitle.style.cssText = "font-size:11px;line-height:1.3;color:#758278";
      content.append(message, subtitle);
      const statusIcon = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      statusIcon.setAttribute("viewBox", "0 0 24 24");
      statusIcon.setAttribute("width", "19");
      statusIcon.setAttribute("height", "19");
      statusIcon.setAttribute("aria-hidden", "true");
      statusIcon.style.cssText =
        "flex:none;margin-left:9px;color:" + (error ? "#b84f4f" : "#408361");
      const path = document.createElementNS(statusIcon.namespaceURI, "path");
      path.setAttribute(
        "d",
        error
          ? "M12 8v5m0 3h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18"
          : "m8 12 3 3 5-6M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18",
      );
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "currentColor");
      path.setAttribute("stroke-width", "1.7");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      statusIcon.append(path);
      label.append(document.importNode(logo, true), content, statusIcon);
      label.setAttribute("role", error ? "alert" : "status");
      label.style.cssText =
        "display:flex;align-items:center;gap:11px;padding:12px 15px 12px 12px;border-radius:13px;background:#fffefb;border:1px solid " +
        (error ? "#ebd8d5" : "#dbe7dc") +
        ";font-family:system-ui;max-width:min(400px,calc(100vw - 72px));box-shadow:0 8px 30px #193b2418,0 2px 5px #193b2408";
      shadow.append(label);
      document.body.append(host);
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduced)
        label.animate(
          [
            { opacity: 0, transform: "translateX(calc(100% + 24px))" },
            { opacity: 1, transform: "translateX(0)" },
          ],
          { duration: 180, easing: "cubic-bezier(.2,.8,.2,1)" },
        );
      setTimeout(
        () => {
          if (reduced || !host.isConnected) {
            host.remove();
            return;
          }
          label
            .animate(
              [
                { opacity: 1, transform: "translateX(0)" },
                { opacity: 0, transform: "translateX(calc(100% + 24px))" },
              ],
              { duration: 140, easing: "ease-in", fill: "forwards" },
            )
            .finished.then(() => host.remove())
            .catch(() => host.remove());
        },
        error ? 5000 : 2200,
      );
    },
    args: [text, error, logoSvg],
  });
}
