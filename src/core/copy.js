import { createExport } from "./formats.js";

export async function copyExport(chat, format) {
  const text = createExport(chat, format === "pdf" ? "md" : format).content;
  const result = await chrome.runtime.sendMessage({
    type: "ai-chat-exporter:copy-conversation",
    url: chat.url,
    text,
  });
  if (!result?.success) throw Error(result?.error || "Clipboard copy failed.");
}
