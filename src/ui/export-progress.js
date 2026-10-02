// Shared progress UI for the injected panel and toolbar popup.
export function createExportProgress(document) {
  const host = document.createElement("div");
  host.className = "export-progress";
  host.hidden = true;
  host.setAttribute("role", "progressbar");
  host.setAttribute("aria-label", "Export progress");
  host.setAttribute("aria-valuemin", "0");
  host.setAttribute("aria-valuemax", "100");
  const label = document.createElement("span");
  label.className = "progress-label";
  const track = document.createElement("div");
  track.className = "progress-track";
  const fill = document.createElement("div");
  fill.className = "progress-fill";
  track.append(fill);
  host.append(label, track);
  function update(value) {
    const percent = Math.round(Math.max(0, Math.min(100, value)));
    host.hidden = false;
    label.textContent = `${percent}%`;
    host.setAttribute("aria-valuenow", String(percent));
    fill.style.width = `${percent}%`;
  }
  return {
    host,
    update,
    start() {
      update(0);
    },
    finish() {
      host.hidden = true;
    },
    hide() {
      host.hidden = true;
    },
  };
}
export async function downloadPdf(chat, update) {
  const requestId = crypto.randomUUID();
  const listener = (message, sender) => {
    if (
      sender.id === chrome.runtime.id &&
      message?.type === "ai-chat-exporter:pdf-progress" &&
      (message.requestId === requestId || message.clientId === requestId)
    )
      update(message.percent);
  };
  chrome.runtime.onMessage.addListener(listener);
  try {
    const result = await chrome.runtime.sendMessage({
      type: "ai-chat-exporter:download-pdf",
      conversation: chat,
      requestId,
    });
    if (!result?.success)
      throw new Error(result?.error || "PDF generation failed.");
    return result;
  } finally {
    chrome.runtime.onMessage.removeListener(listener);
  }
}
