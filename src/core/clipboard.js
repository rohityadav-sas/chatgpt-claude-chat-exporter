export async function writeClipboard(
  text,
  ensureToolsDocument,
  api = globalThis.chrome,
  clipboard = globalThis.navigator?.clipboard,
) {
  if (!api.offscreen) {
    if (!clipboard?.writeText) throw Error("Clipboard API is unavailable.");
    await clipboard.writeText(text);
    return { success: true };
  }
  await ensureToolsDocument();
  return api.runtime.sendMessage({
    type: "ai-chat-exporter:copy-clipboard",
    text,
  });
}
