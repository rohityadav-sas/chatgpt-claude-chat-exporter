import { readChatGPT } from "./chatgpt.js";
import { readClaude } from "./claude.js";
import { readDeepSeek } from "./deepseek.js";
import { readGrok } from "./grok.js";
import { readGemini } from "./gemini.js";
import { readPerplexity } from "./perplexity.js";
import { readQwen, readMistral } from "./state.js";
import { findProvider } from "../providers/index.js";
const readers = {
  chatgpt: readChatGPT,
  claude: readClaude,
  deepseek: readDeepSeek,
  grok: readGrok,
  gemini: readGemini,
  perplexity: readPerplexity,
  qwen: readQwen,
  mistral: readMistral,
};
export async function readDirectConversation() {
  const url = location.href,
    start = performance.now();
  const provider = findProvider(url);
  if (!provider) throw new Error("Unsupported conversation website.");
  const data = await readers[provider.id]();
  if (location.href !== url)
    throw new Error("The conversation changed. Extract it again.");
  if (!data.messages?.length)
    throw new Error("Full conversation data is unavailable.");
  return {
    schemaVersion: 1,
    provider: provider.id,
    title: data.title || document.title,
    url,
    exportedAt: new Date().toISOString(),
    messages: data.messages,
    scope:
      "Active conversation branch read directly from conversation data. Available attachment text is included; images and files without extracted text are recorded as placeholders; hidden reasoning and tool internals are excluded.",
    capture: {
      source: data.source || "conversation-api",
      complete: true,
      scrolled: false,
      durationMs: Math.round(performance.now() - start),
    },
  };
}
