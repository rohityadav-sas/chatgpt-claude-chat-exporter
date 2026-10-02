export function toMarkdown(chat) {
  return `# ${chat.title.replace(/\n/g, " ")}\n\nSource: ${chat.url}\nExported: ${chat.exportedAt}\n\n> ${chat.scope}\n\n${chat.messages.map((message) => `## ${message.role === "user" ? "You" : "Assistant"}\n\n${message.markdown}`).join("\n\n---\n\n")}\n`;
}
export function toText(chat) {
  return `${chat.title}\n${chat.url}\nExported: ${chat.exportedAt}\n${chat.scope}\n\n${chat.messages.map((message) => `${message.role === "user" ? "YOU" : "ASSISTANT"}\n${message.text}`).join("\n\n----------------------------------------\n\n")}\n`;
}
export function createExport(chat, format) {
  const formats = {
    md: ["text/markdown;charset=utf-8", toMarkdown],
    txt: ["text/plain;charset=utf-8", toText],
    json: [
      "application/json;charset=utf-8",
      (value) => JSON.stringify(value, null, 2),
    ],
  };
  if (!formats[format]) throw new Error("Unknown export format.");
  const [mime, serialize] = formats[format];
  let name =
    chat.title
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, "-")
      .slice(0, 100)
      .replace(/[. ]+$/, "") || "conversation";
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name))
    name = `chat-${name}`;
  return { filename: `${name}.${format}`, mime, content: serialize(chat) };
}
