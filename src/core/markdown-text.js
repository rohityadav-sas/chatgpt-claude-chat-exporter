import { marked } from "marked";
const decode = (text) =>
  text.replace(
    /&(?:lt|gt|amp|quot|#39);/g,
    (value) =>
      ({ "&lt;": "<", "&gt;": ">", "&amp;": "&", "&quot;": '"', "&#39;": "'" })[
        value
      ],
  );
function inline(tokens) {
  return (tokens || [])
    .map((token) => {
      if (token.type === "image")
        return `[Image: ${token.text || "attachment"}]`;
      if (token.type === "link")
        return `${inline(token.tokens)} (${token.href})`;
      if (token.type === "br") return "\n";
      return token.tokens
        ? inline(token.tokens)
        : token.text || token.raw || "";
    })
    .join("");
}
export function markdownText(markdown) {
  return decode(
    marked
      .lexer(markdown)
      .map((token) => {
        if (token.type === "space") return "";
        if (token.type === "code") return token.text;
        if (token.type === "list")
          return token.items
            .map(
              (item, index) =>
                `${token.ordered ? `${(token.start || 1) + index}.` : "•"} ${markdownText(item.text)}`,
            )
            .join("\n");
        if (token.type === "table")
          return [token.header, ...token.rows]
            .map((row) => row.map((cell) => inline(cell.tokens)).join(" | "))
            .join("\n");
        if (token.type === "blockquote") return markdownText(token.text);
        if (token.type === "hr") return "—";
        return token.tokens
          ? inline(token.tokens)
          : token.text || token.raw || "";
      })
      .filter(Boolean)
      .join("\n\n"),
  ).trim();
}
