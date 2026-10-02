import test from "node:test";
import assert from "node:assert/strict";
import { pdfDocument } from "../src/core/pdf-document.js";
function nodes(value) {
  if (!value || typeof value !== "object") return [];
  return [value, ...Object.values(value).flatMap(nodes)];
}
const chat = (markdown) => ({
  title: "Test",
  provider: "claude",
  url: "https://claude.ai/chat/test",
  scope: "Selected messages",
  exportedAt: "2026-10-03",
  messages: [{ role: "assistant", markdown }],
});
test("PDF layout preserves Markdown structure, literal code and Unicode fonts", () => {
  const doc = pdfDocument(
    chat(
      '## Heading\n\n**Bold** &amp; नेपाली\n\n```js\nconst x = "&amp;";\n```\n\n| A | B |\n|---|---|\n| 1 | 2 |',
    ),
  );
  const all = nodes(doc);
  const text = all
    .flatMap((node) => (Array.isArray(node.text) ? node.text : []))
    .map((run) => run.text)
    .join("");
  assert.ok(text.includes("Bold & नेपाली"));
  assert.ok(text.includes('const x = "&amp;";'));
  assert.ok(
    all.some((node) => node.text?.some?.((run) => run.font === "Devanagari")),
  );
  assert.ok(
    all.some((node) => node.text?.some?.((run) => run.font === "Mono")),
  );
  assert.equal(
    all.find((node) => node.table?.headerRows === 1).table.body.length,
    2,
  );
});
test("PDF layout does not load external images or activate unsafe links", () => {
  const doc = pdfDocument(
    chat(
      "![private](https://example.com/tracker)\n\n[unsafe](javascript:alert%281%29)",
    ),
  );
  const json = JSON.stringify(doc);
  assert.ok(!json.includes("tracker"));
  assert.ok(!json.includes("javascript:"));
  assert.ok(json.includes("[Image: private]"));
});

test("PDF chat layout separates speakers and pasted-text cards", () => {
  const input = chat("Assistant reply");
  input.messages.unshift({
    role: "user",
    markdown: "Original combined export",
    bodyMarkdown: "My prompt",
    attachments: [
      {
        name: "Pasted text",
        text: "# Earlier conversation\n\nPASTED_CARD_CONTENT",
      },
    ],
  });
  const doc = pdfDocument(input);
  const bubbles = doc.content.filter((node) => node.columns);
  assert.ok(bubbles[0].margin[0] > bubbles[1].margin[0]);
  assert.ok(bubbles[0].columns[1].svg);
  assert.ok(bubbles[1].columns[0].svg);
  const json = JSON.stringify(doc);
  assert.ok(json.includes("PASTED / ATTACHED TEXT"));
  assert.ok(json.includes("PASTED_CARD_CONTENT"));
  assert.ok(!json.includes("Original combined export"));
});
