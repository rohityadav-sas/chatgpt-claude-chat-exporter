import { qwenTitle } from "./qwen-title.js";
export function conversationTitle(value, providerName = "AI") {
  return (
    String(value || "")
      .replace(
        /\s*[-|–]\s*(ChatGPT|Grok|DeepSeek|(?:Google )?Gemini|Claude|Qwen|Perplexity|Mistral).*$/i,
        "",
      )
      .trim() || `${providerName} conversation`
  );
}

export function pageConversationTitle(document, url, providerName) {
  return (
    (providerName === "Qwen" && qwenTitle(document, url)) ||
    conversationTitle(document.title, providerName)
  );
}
