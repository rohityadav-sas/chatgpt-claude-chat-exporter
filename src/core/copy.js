import { createExport } from "./formats.js";

export async function copyExport(chat, format) {
  if (format === "pdf") throw Error("PDF is download only.");
  const text = createExport(chat, format).content;
  const result = await chrome.runtime.sendMessage({
    type: "ai-chat-exporter:copy-conversation",
    url: chat.url,
    text,
  });
  if (!result?.success) throw Error(result?.error || "Clipboard copy failed.");
}
