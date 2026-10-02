import TurndownService from "turndown";
// A detached copy is built in one source walk; never mutate or fetch the page.
export function websiteMarkdown(document) {
  const start = performance.now();
  const target = document.implementation.createHTMLDocument("");
  const excluded = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "TEMPLATE",
    "INPUT",
    "TEXTAREA",
    "SELECT",
  ]);
  function copy(source, depth = 0) {
    if (source.nodeType === 3) return target.createTextNode(source.textContent);
    if (
      source.nodeType !== 1 ||
      excluded.has(source.tagName) ||
      source.hidden ||
      source.getAttribute("aria-hidden") === "true" ||
      source.hasAttribute("data-ai-chat-exporter") ||
      /(?:display\s*:\s*none|visibility\s*:\s*hidden)/i.test(
        source.getAttribute("style") || "",
      )
    )
      return null;
    if (source.tagName === "IFRAME") {
      if (depth >= 4) return null;
      try {
        if (source.contentDocument?.body)
          return copy(source.contentDocument.body, depth + 1);
      } catch {}
      const href = source.getAttribute("src");
      if (!href) return null;
      const a = target.createElement("a");
      a.textContent = source.title || "Embedded content";
      try {
        a.href = new URL(href, source.baseURI).href;
      } catch {
        return null;
      }
      return a;
    }
    const node = target.createElement(
      source.tagName === "BODY" ? "div" : source.tagName.toLowerCase(),
    );
    for (const name of ["href", "src", "alt", "title", "start", "class"]) {
      const value = source.getAttribute(name);
      if (value === null) continue;
      if (name === "href" || name === "src") {
        try {
          const url = new URL(value, source.baseURI);
          if (!["http:", "https:", "mailto:", "tel:"].includes(url.protocol))
            continue;
          node.setAttribute(name, url.href);
        } catch {}
      } else node.setAttribute(name, value);
    }
    const children = source.shadowRoot?.childNodes || source.childNodes;
    for (const child of children) {
      const result = copy(child, depth);
      if (result) node.append(result);
    }
    return node;
  }
  const root = copy(document.body);
  if (!root) throw Error("This page has no readable content.");
  const service = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  service.addRule("code", {
    filter: "pre",
    replacement: (_, node) => {
      const code = node.querySelector("code") || node;
      const text = code.textContent.replace(/\n$/, "");
      const fence = "`".repeat(
        Math.max(
          3,
          ...Array.from(text.matchAll(/`+/g), (m) => m[0].length + 1),
        ),
      );
      const language = code.className.match(/language-([\w+-]+)/)?.[1] || "";
      return "\n\n" + fence + language + "\n" + text + "\n" + fence + "\n\n";
    },
  });
  service.addRule("tables", {
    filter: "table",
    replacement: (_, node) => {
      const rows = Array.from(node.rows || []).map((row) =>
        Array.from(row.cells).map((cell) =>
          service.turndown(cell).replace(/\|/g, "\\|").replace(/\n/g, "<br>"),
        ),
      );
      if (!rows.length) return "";
      const width = Math.max(...rows.map((r) => r.length));
      const line = (row) =>
        "| " +
        Array.from({ length: width }, (_, i) => row[i] || "").join(" | ") +
        " |";
      return (
        "\n\n" +
        [
          line(rows[0]),
          line(Array(width).fill("---")),
          ...rows.slice(1).map(line),
        ].join("\n") +
        "\n\n"
      );
    },
  });
  const body = service.turndown(root).trim();
  if (!body) throw Error("This page has no readable content.");
  return {
    markdown:
      "# " +
      (document.title || "Untitled page").replace(/\n/g, " ") +
      "\n\nSource: " +
      document.location.href +
      "\n\n" +
      body +
      "\n",
    elapsedMs: Math.round(performance.now() - start),
  };
}
