import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { websiteMarkdown } from "../src/core/website-markdown.js";
test("Whole-page Markdown preserves navigation, article, footer, tables, captions and code without mutation", () => {
  const dom = new JSDOM(
    '<title>Page</title><nav><a href="/docs">Docs</a></nav><main><h1>Heading</h1><p>Hello <strong>world</strong></p><figure><img src="/photo.png" alt="Photo"><figcaption>Caption</figcaption></figure><pre><code class="language-js">const x = ```;</code></pre><table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table><div hidden>HIDDEN</div><script>SECRET_SCRIPT</script><input value="PASSWORD"></main><footer>Footer text</footer>',
    { url: "https://example.com/page" },
  );
  const before = dom.window.document.body.innerHTML;
  const { markdown } = websiteMarkdown(dom.window.document);
  for (const value of [
    "[Docs](https://example.com/docs)",
    "# Heading",
    "**world**",
    "https://example.com/photo.png",
    "Caption",
    "| A | B |",
    "Footer text",
    "const x = ```;",
  ])
    assert.ok(markdown.includes(value), value);
  assert.ok(!/HIDDEN|SECRET_SCRIPT|PASSWORD/.test(markdown));
  assert.equal(dom.window.document.body.innerHTML, before);
});
test("Open shadow content and accessible iframes are included in place", () => {
  const dom = new JSDOM(
    '<title>Embedded</title><section id="host"></section><iframe></iframe>',
    { url: "https://example.com" },
  );
  dom.window.document
    .querySelector("#host")
    .attachShadow({ mode: "open" }).innerHTML = "<p>SHADOW CONTENT</p>";
  dom.window.document.querySelector("iframe").contentDocument.body.innerHTML =
    "<p>FRAME CONTENT</p>";
  const { markdown } = websiteMarkdown(dom.window.document);
  assert.ok(markdown.includes("SHADOW CONTENT"));
  assert.equal(markdown.split("FRAME CONTENT").length, 2);
});
