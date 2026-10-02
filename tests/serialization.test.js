import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { serializeMessage } from "../src/core/serialize.js";

test("Monaco code survives hidden editor layers and preserves multiple lines", () => {
  const document = new JSDOM(
    '<div id="body"><pre class="qwen-markdown-code"><div class="qwen-markdown-code-header"><div>javascript</div></div><div data-mode-id="javascript"><div aria-hidden="true" class="view-lines"><div class="view-line">const&nbsp;n = 42;</div><div class="view-line">console.log(n);</div></div></div></pre></div>',
  ).window.document;
  const result = serializeMessage(document.getElementById("body"));
  assert.equal(
    result.markdown,
    "```javascript\nconst n = 42;\nconsole.log(n);\n```",
  );
  assert.ok(result.text.includes("console.log(n);"));
  assert.ok(
    document.querySelector(".view-lines"),
    "original DOM must remain unchanged",
  );
});
test("Modern code wrappers keep the language without exporting toolbar labels", () => {
  const document = new JSDOM(
    '<div id="body"><div class="markdown-fenced-code-root"><i aria-label="javascript icon"></i><span>javascript</span><button>Copy</button><pre><code>const n = 42;</code></pre></div></div>',
  ).window.document;
  assert.equal(
    serializeMessage(document.getElementById("body")).markdown,
    "```javascript\nconst n = 42;\n```",
  );
});
test("Multiline user prompts retain their line breaks", () => {
  const document = new JSDOM(
    '<div class="whitespace-pre-wrap">First line\nSecond line\nThird line</div>',
  ).window.document;
  const result = serializeMessage(document.querySelector("div"));
  assert.ok(result.markdown.includes("First line  \nSecond line"));
  assert.equal(result.text, "First line\nSecond line\nThird line");
});
