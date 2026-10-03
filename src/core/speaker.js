export function aiName(provider) {
  return (
    {
      chatgpt: "ChatGPT",
      claude: "Claude",
      deepseek: "DeepSeek",
      grok: "Grok",
      gemini: "Gemini",
      qwen: "Qwen",
      perplexity: "Perplexity",
      mistral: "Mistral",
    }[provider] ||
    provider ||
    "AI"
  );
}
export function speakerName(chat, message) {
  return message.role === "user" ? "User" : aiName(chat.provider);
}
