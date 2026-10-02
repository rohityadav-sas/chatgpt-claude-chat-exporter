import { pageConversationTitle } from "./conversation-title.js";
import { findProvider } from "../providers/index.js";

export function extractConversation(document, url) {
  const provider = findProvider(url);
  if (!provider) throw new Error("This website is not supported yet.");
  const messages = provider.extract(document);
  if (!messages.length)
    throw new Error(
      "No messages found. Open a conversation and wait for it to load, then try again.",
    );
  return {
    schemaVersion: 1,
    provider: provider.id,
    title: pageConversationTitle(document, url, provider.name),
    url,
    exportedAt: new Date().toISOString(),
    scope:
      "Messages rendered in the active conversation branch. Hidden artifacts and unloaded content are excluded.",
    messages,
  };
}
