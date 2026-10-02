import { captureConversation } from "./core/capture.js";
// executeScript reads this final expression as its result. No permanent listener.
globalThis.__aiChatExporterResult = (async () => {
  try {
    return { conversation: await captureConversation(document, location.href) };
  } catch (error) {
    return { error: error.message };
  }
})();
