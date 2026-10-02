import { extractConversation } from "./extract.js";
import { markdownText } from "./markdown-text.js";
// MAIN-world readers return normalized messages; credentials stay in the page.
export async function captureConversation(document, url, onCount) {
  let reason =
    "The extension connection is unavailable. Reload the extension and refresh this chat.";
  if (globalThis.chrome?.runtime?.id) {
    try {
      const result = await chrome.runtime.sendMessage({
        type: "ai-chat-exporter:read-direct",
        url,
      });
      if (result?.conversation) {
        if (document.defaultView.location.href !== url)
          throw new Error("The conversation changed. Extract it again.");
        if (onCount) {
          onCount(result.conversation.messages.length);
          // Let the count paint before converting long Markdown attachments.
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
        return {
          ...result.conversation,
          messages: result.conversation.messages.map((message) => ({
            ...message,
            text: markdownText(message.markdown),
          })),
        };
      }
      reason = result?.error || reason;
    } catch (error) {
      reason =
        /context invalidated|receiving end does not exist|message port closed/i.test(
          error.message,
        )
          ? "The extension connection was interrupted. Reload the extension and refresh this chat."
          : error.message;
    }
  }
  if (document.defaultView.location.href !== url)
    throw new Error("The conversation changed. Extract it again.");
  const conversation = extractConversation(document, url);
  return {
    ...conversation,
    scope:
      "Partial export: only currently rendered messages. Full conversation data could not be read. The page was not scrolled.",
    capture: {
      source: "rendered-dom",
      complete: false,
      scrolled: false,
      reason,
    },
  };
}
