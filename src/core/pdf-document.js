import { libraryIcons } from "../ui/library-icons.js";
import { providerLogoSvg } from "./provider-logo-display.js";
import { decodeHTML } from "entities";
import { marked } from "marked";

// Convert Markdown tokens directly to PDF layout nodes; no DOM or canvas rendering.
function runs(text, attributes = {}) {
  return String(text)
    .split(/([\u0900-\u097f]+)/u)
    .filter(Boolean)
    .map((text) => ({
      text,
      ...attributes,
      ...(/[\u0900-\u097f]/u.test(text) ? { font: "Devanagari" } : {}),
    }));
}
function inline(tokens = []) {
  return tokens.flatMap((token) => {
    if (token.type === "br") return runs("\n");
    if (
      token.type === "strong" ||
      token.type === "em" ||
      token.type === "del" ||
      token.type === "link"
    ) {
      const attrs =
        token.type === "strong"
          ? { bold: true }
          : token.type === "em"
            ? { italics: true }
            : token.type === "del"
              ? { decoration: "lineThrough" }
              : {
                  color: "#255c46",
                  ...(/^https?:\/\//i.test(token.href)
                    ? { link: token.href }
                    : {}),
                };
      return inline(token.tokens || []).map((run) => ({ ...run, ...attrs }));
    }
    if (token.type === "codespan")
      return runs(token.text, { background: "#eef2ee" });
    if (token.type === "image")
      return runs(`[Image: ${token.text || "attachment"}]`);
    if (token.type === "html")
      return runs(decodeHTML(token.text.replace(/<[^>]*>/g, "")));
    if (token.tokens) return inline(token.tokens);
    return runs(decodeHTML(token.text || token.raw || ""));
  });
}
function blocks(tokens) {
  return tokens.flatMap((token) => {
    if (token.type === "space") return [];
    if (token.type === "heading")
      return [
        {
          text: inline(token.tokens),
          fontSize: Math.max(12, 22 - token.depth * 2),
          bold: true,
          margin: [0, 8, 0, 5],
        },
      ];
    if (token.type === "code")
      return [
        card(
          [
            {
              text: token.lang || "CODE",
              fontSize: 7,
              color: "#788b7d",
              margin: [0, 0, 0, 7],
            },
            {
              text: runs(token.text, { font: "Mono" }),
              style: "code",
              preserveLeadingSpaces: true,
            },
          ],
          "#e6ece5",
          true,
        ),
      ];
    if (token.type === "blockquote")
      return [
        {
          stack: blocks(token.tokens),
          margin: [12, 4, 0, 6],
          color: "#52645a",
        },
      ];
    if (token.type === "list")
      return [
        {
          [token.ordered ? "ol" : "ul"]: token.items.map((item) => ({
            stack: blocks(item.tokens),
          })),
          ...(token.ordered ? { start: token.start } : {}),
          margin: [0, 3, 0, 6],
        },
      ];
    if (token.type === "table") {
      const cell = (value, header = false) => ({
        text: inline(value.tokens),
        bold: header,
        fillColor: header ? "#eef2ee" : undefined,
        margin: [3, 3, 3, 3],
      });
      return [
        {
          table: {
            headerRows: 1,
            widths: token.header.map(() => "*"),
            body: [
              token.header.map((v) => cell(v, true)),
              ...token.rows.map((row) => row.map((v) => cell(v))),
            ],
          },
          layout: "lightHorizontalLines",
          margin: [0, 4, 0, 8],
        },
      ];
    }
    if (token.type === "hr")
      return [
        {
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 340,
              y2: 0,
              lineWidth: 0.5,
              lineColor: "#ced9cf",
            },
          ],
          margin: [0, 6, 0, 6],
        },
      ];
    return [
      {
        text: token.tokens
          ? inline(token.tokens)
          : runs(token.text || token.raw || ""),
        margin: [0, 0, 0, 6],
      },
    ];
  });
}

const userIcon = libraryIcons.user
  .replace(/<!--[\s\S]*?-->/g, "")
  .replaceAll("currentColor", "#255c46");
const aiIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="14" fill="#255c46"/><path d="M14 5l2.5 6.5L23 14l-6.5 2.5L14 23l-2.5-6.5L5 14l6.5-2.5z" fill="#ffffff"/></svg>';
function card(stack, fill, border = false) {
  return {
    table: { widths: ["*"], body: [[{ stack, fillColor: fill }]] },
    layout: {
      hLineWidth: () => (border ? 0.6 : 0),
      vLineWidth: () => (border ? 0.6 : 0),
      hLineColor: () => "#d8dfd5",
      vLineColor: () => "#d8dfd5",
      paddingLeft: () => 14,
      paddingRight: () => 14,
      paddingTop: () => 12,
      paddingBottom: () => 10,
    },
    margin: [0, 0, 0, 6],
  };
}
function chatMessage(message, provider, providerId) {
  const human = message.role === "user";
  const contents = blocks(
    marked.lexer(
      message.bodyMarkdown ?? message.markdown ?? message.text ?? "",
    ),
  );
  for (const file of message.attachments || []) {
    contents.push(
      card(
        [
          {
            text: file.text ? "PASTED / ATTACHED TEXT" : "ATTACHMENT",
            fontSize: 7,
            bold: true,
            color: "#856841",
            characterSpacing: 0.8,
            margin: [0, 0, 0, 5],
          },
          {
            text: runs(file.name),
            bold: true,
            fontSize: 10,
            color: "#5e4e38",
            margin: [0, 0, 0, 10],
          },
          ...blocks(marked.lexer(file.text || "[File content unavailable]")),
        ],
        "#faf5e9",
        true,
      ),
    );
  }
  const bubble = {
    width: "*",
    stack: [
      {
        text: human ? "YOU" : provider.toUpperCase(),
        alignment: human ? "right" : "left",
        color: "#527260",
        fontSize: 8,
        bold: true,
        characterSpacing: 0.7,
        margin: [0, 0, 0, 6],
      },
      card(
        contents.length ? contents : [{ text: " " }],
        human ? "#eaf2e9" : "#f6f7f4",
      ),
    ],
  };
  const avatar = {
    svg: human ? userIcon : providerLogoSvg(providerId) || aiIcon,
    width: 25,
    margin: [0, 0, 0, 0],
  };
  return {
    columns: human ? [bubble, avatar] : [avatar, bubble],
    columnGap: 10,
    margin: human ? [66, 0, 0, 15] : [0, 0, 30, 15],
  };
}
export function pdfDocument(chat) {
  const provider =
    {
      chatgpt: "ChatGPT",
      claude: "Claude",
      deepseek: "DeepSeek",
      grok: "Grok",
      gemini: "Gemini",
      qwen: "Qwen",
      perplexity: "Perplexity",
      mistral: "Mistral",
    }[chat.provider] ||
    chat.provider ||
    "AI";
  return {
    info: { title: chat.title, creator: "AI Chat Exporter" },
    pageSize: "A4",
    pageMargins: [38, 38, 38, 42],
    defaultStyle: {
      font: "Roboto",
      fontSize: 10,
      lineHeight: 1.25,
      color: "#25362d",
    },
    styles: {
      code: {
        fontSize: 8.5,
        color: "#263b30",

        margin: [4, 5, 0, 8],
      },
    },
    footer: (page, total) => ({
      columns: [{ text: page + " / " + total, alignment: "right" }],
      margin: [38, 14, 38, 0],
      fontSize: 8,
      color: "#829087",
    }),
    content: [
      {
        text: runs(chat.title),
        alignment: "center",
        fontSize: 25,
        bold: true,
        color: "#213d2d",
        margin: [0, 0, 0, 8],
      },
      {
        text: [
          `${chat.messages.length} messages`,
          localTimestamp(chat.exportedAt),
        ]
          .filter(Boolean)
          .join("   ·   "),
        alignment: "center",
        fontSize: 7,
        color: "#829087",
        margin: [0, 0, 0, 24],
      },
      ...chat.messages.map((message) =>
        chatMessage(message, provider, chat.provider),
      ),
    ],
  };
}

function localTimestamp(timestamp) {
  const date = new Date(timestamp);
  if (!timestamp || Number.isNaN(date.getTime())) return "";
  const day = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
  }).format(date);
  const year = new Intl.DateTimeFormat("en-GB", { year: "numeric" }).format(
    date,
  );
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  return `${day}, ${year}   ·   ${time}`;
}
