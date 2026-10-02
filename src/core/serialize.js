import TurndownService from "turndown";

// Convert a cloned message only; never mutate the conversation page.
export function serializeMessage(element) {
  const clone = element.cloneNode(true);
  normalizeCodeBlocks(clone);
  clone
    .querySelectorAll(
      'button, script, style, nav, textarea, [aria-hidden="true"], .sr-only, .cdk-visually-hidden, .screen-reader-user-query-label, .model-response-label-announcer',
    )
    .forEach((node) => node.remove());
  // User prompts commonly render literal newlines in a pre-wrap DIV.
  // Turndown normally collapses these, so make the line breaks explicit first.
  for (const block of [
    clone,
    ...clone.querySelectorAll(".whitespace-pre-wrap, .fbb737a4"),
  ]) {
    if (!block.matches(".whitespace-pre-wrap, .fbb737a4")) continue;
    for (const child of Array.from(block.childNodes)) {
      if (child.nodeType !== 3 || !child.textContent.includes("\n")) continue;
      const fragment = clone.ownerDocument.createDocumentFragment();
      child.textContent.split("\n").forEach((line, index) => {
        if (index) fragment.append(clone.ownerDocument.createElement("br"));
        fragment.append(clone.ownerDocument.createTextNode(line));
      });
      child.replaceWith(fragment);
    }
  }
  clone.querySelectorAll(".katex").forEach((node) => {
    const tex = node.querySelector(
      'annotation[encoding="application/x-tex"]',
    )?.textContent;
    if (tex)
      node.replaceWith(
        clone.ownerDocument.createTextNode(
          node.closest(".katex-display") ? `\n$$${tex}$$\n` : `$${tex}$`,
        ),
      );
  });
  const service = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  const escapeMarkdown = service.escape;
  // Literal HTML discussed in a chat must remain text in the PDF renderer.
  service.escape = (text) =>
    escapeMarkdown(
      text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
    );
  service.addRule("code", {
    filter: "pre",
    replacement: (_, node) => {
      const code = node.querySelector("code") || node;
      const language = code.className.match(/language-([\w+-]+)/)?.[1] || "";
      const text = code.textContent.replace(/\n$/, "");
      const fence = "`".repeat(
        Math.max(
          3,
          ...Array.from(text.matchAll(/`+/g), (match) => match[0].length + 1),
        ),
      );
      return `\n\n${fence}${language}\n${text}\n${fence}\n\n`;
    },
  });
  service.addRule("tables", {
    filter: "table",
    replacement: (_, node) => {
      const rows = Array.from(node.querySelectorAll("tr")).map((row) =>
        Array.from(row.children).map((cell) =>
          service.turndown(cell).replace(/\|/g, "\\|").replace(/\n/g, "<br>"),
        ),
      );
      if (!rows.length) return "";
      const width = Math.max(...rows.map((row) => row.length));
      const line = (row) =>
        `| ${Array.from({ length: width }, (_, i) => row[i] || "").join(" | ")} |`;
      return `\n\n${line(rows[0])}\n${line(Array(width).fill("---"))}\n${rows.slice(1).map(line).join("\n")}\n\n`;
    },
  });
  service.addRule("images", {
    filter: "img",
    replacement: (_, node) => {
      // Private image URLs often expire. Record their presence without fetching them.
      return ` [Image: ${(node.alt || "attachment").replace(/[\[\]\n]/g, " ")}] `;
    },
  });
  return {
    markdown: service.turndown(clone).trim(),
    text: readableText(clone).trim(),
  };
}

function normalizeCodeBlocks(root) {
  const blocks = Array.from(
    root.querySelectorAll(
      "pre, code-block, .markdown-fenced-code-root, .md-code-block",
    ),
  );
  for (const block of blocks.filter(
    (node) => !blocks.some((other) => other !== node && other.contains(node)),
  )) {
    const editorLines = block.querySelectorAll(
      ".view-lines .view-line, .cm-content .cm-line",
    );
    const source = block.querySelector("pre code, code");
    if (!editorLines.length && !source) continue;
    const text = editorLines.length
      ? Array.from(editorLines, (line) =>
          line.textContent.replace(/\u00a0/g, " "),
        ).join("\n")
      : source.textContent;
    const language =
      source?.className.match(/language-([\w+-]+)/)?.[1] ||
      block.querySelector("[data-mode-id]")?.getAttribute("data-mode-id") ||
      block
        .querySelector(
          ".qwen-markdown-code-header > div, .md-code-block-infostring",
        )
        ?.textContent.trim() ||
      block
        .querySelector('i[aria-label$=" icon"]')
        ?.getAttribute("aria-label")
        .replace(/ icon$/, "") ||
      "";
    const pre = root.ownerDocument.createElement("pre");
    const code = root.ownerDocument.createElement("code");
    if (/^[\w+-]+$/.test(language)) code.className = `language-${language}`;
    code.textContent = text;
    pre.append(code);
    block.replaceWith(pre);
  }
}

function readableText(node) {
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1) return "";
  if (node.tagName === "BR") return "\n";
  if (node.tagName === "IMG") return `[Image: ${node.alt || "attachment"}]`;
  const value = Array.from(node.childNodes).map(readableText).join("");
  if (
    [
      "P",
      "DIV",
      "PRE",
      "BLOCKQUOTE",
      "H1",
      "H2",
      "H3",
      "UL",
      "OL",
      "TABLE",
      "TR",
    ].includes(node.tagName)
  )
    return `${value}\n\n`;
  if (node.tagName === "LI") return `- ${value}\n`;
  if (["TD", "TH"].includes(node.tagName)) return `${value}\t`;
  return value;
}
