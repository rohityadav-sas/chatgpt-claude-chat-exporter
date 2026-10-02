import { chatgpt } from "./chatgpt.js";
import { claude } from "./claude.js";
import { grok } from "./grok.js";
import { deepseek } from "./deepseek.js";
import { gemini } from "./gemini.js";
import { qwen } from "./qwen.js";
import { perplexity } from "./perplexity.js";
import { mistral } from "./mistral.js";
export const providers = [
  chatgpt,
  claude,
  grok,
  deepseek,
  gemini,
  qwen,
  perplexity,
  mistral,
];
export function findProvider(url) {
  try {
    const host = new URL(url).hostname;
    return providers.find((provider) => provider.hosts.includes(host));
  } catch {
    return undefined;
  }
}
