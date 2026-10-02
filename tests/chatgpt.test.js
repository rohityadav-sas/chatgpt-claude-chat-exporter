import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { extractConversation } from "../src/core/extract.js";
import { createExport } from "../src/core/formats.js";
import { findProvider } from "../src/providers/index.js";

test("ChatGPT: preserves order, rich text, duplicate prompts, math and attachments", () => {
  const { document } =
    new JSDOM(`<title>Study - ChatGPT</title><aside data-message-author-role="user">sidebar</aside><main>
  <div data-message-author-role="user"><div class="whitespace-pre-wrap">Explain &lt;script&gt; and नेपाली.</div></div>
  <div data-message-author-role="assistant" data-message-id="answer"><div class="markdown"><h2>Answer</h2><p><strong>Bold</strong> <a href="https://example.com">source</a></p><pre><button>Copy</button><code class="language-js">const x = &#96;hello&#96;;</code></pre><table><tr><th>A</th><th>B</th></tr><tr><td>x|y</td><td>2</td></tr></table><p><span class="katex"><span aria-hidden="true">visual</span><annotation encoding="application/x-tex">x^2</annotation></span></p><img alt="Diagram" src="https://private.invalid/image"><button>Like</button></div></div>
  <div data-message-author-role="user"><div class="whitespace-pre-wrap">Explain &lt;script&gt; and नेपाली.</div></div>
  <div data-message-author-role="tool">hidden tool</div></main>`).window;
  const chat = extractConversation(document, "https://chatgpt.com/c/test");
  assert.equal(chat.messages.length, 3);
  assert.deepEqual(
    chat.messages.map((item) => item.role),
    ["user", "assistant", "user"],
  );
  assert.equal(chat.title, "Study");
  const answer = chat.messages[1].markdown;
  for (const snippet of [
    "## Answer",
    "**Bold**",
    "[source](https://example.com)",
    "```js",
    "const x = `hello`;",
    "| A | B |",
    "x\\|y",
    "$x^2$",
    "[Image: Diagram]",
  ])
    assert.ok(answer.includes(snippet), snippet);
  assert.ok(!answer.includes("Copy"));
  assert.equal(chat.messages[0].text, chat.messages[2].text);
  assert.ok(chat.messages[0].markdown.includes("&lt;script&gt;"));
  assert.equal(
    JSON.parse(createExport(chat, "json").content).messages.length,
    3,
  );
  assert.ok(createExport(chat, "md").content.includes("## You"));
  assert.ok(createExport(chat, "txt").content.includes("नेपाली"));
});
test("Empty chats and lookalike domains fail clearly", () => {
  const document = new JSDOM("<main></main>").window.document;
  assert.throws(
    () => extractConversation(document, "https://chatgpt.com"),
    /No messages/,
  );
  assert.equal(findProvider("https://chatgpt.com.evil.test"), undefined);
  assert.throws(
    () => extractConversation(document, "https://example.com"),
    /not supported/,
  );
});
