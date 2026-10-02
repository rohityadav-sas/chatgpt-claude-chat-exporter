import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { activeBranch } from "../src/direct/shared.js";
import { geminiMessages, parseGeminiBatch } from "../src/direct/gemini.js";
import { perplexityMessages } from "../src/direct/perplexity.js";
import { markdownText } from "../src/core/markdown-text.js";
import { captureConversation } from "../src/core/capture.js";

test("Direct branch traversal preserves repeated messages and excludes alternate answers", () => {
  const nodes = [
    { id: "1", parent: null },
    { id: "2", parent: "1" },
    { id: "alternate", parent: "1" },
    { id: "3", parent: "2" },
  ];
  assert.deepEqual(
    activeBranch(
      nodes,
      "3",
      (n) => n.id,
      (n) => n.parent,
    ).map((n) => n.id),
    ["1", "2", "3"],
  );
  assert.throws(
    () =>
      activeBranch(
        nodes,
        "missing",
        (n) => n.id,
        (n) => n.parent,
      ),
    /unavailable/,
  );
  assert.throws(
    () =>
      activeBranch(
        [{ id: "1", parent: "missing" }],
        "1",
        (n) => n.id,
        (n) => n.parent,
      ),
    /incomplete/,
  );
});
test("Gemini batch reader orders newest-first turns and ignores auxiliary text", () => {
  const turn = (id, query, answer) => [
    ["chat", id],
    null,
    [[query]],
    [[["candidate", [answer]]], null, ["unrelated citation"]],
  ];
  const data = [
    [turn("2", "same", "second"), turn("1", "same", "first")],
    null,
  ];
  const body = `)]}'\n\n100\n${JSON.stringify([["wrb.fr", "hNvQHb", JSON.stringify(data)]])}\n`;
  const messages = geminiMessages(parseGeminiBatch(body)[0]);
  assert.deepEqual(
    messages.map((m) => m.markdown),
    ["same", "first", "same", "second"],
  );
});
test("Perplexity unwraps nested final answer without including workflow internals", () => {
  const messages = perplexityMessages([
    {
      uuid: "1",
      created_us: 1,
      query_str: "Hello",
      text: JSON.stringify([
        { step_type: "ASI_TOOL_OUTPUT", content: { secret: "internal" } },
        {
          step_type: "FINAL",
          content: {
            answer: JSON.stringify({
              answer: "**Hello**\n\n```js\nconst n = 42;\n```",
              web_results: ["source"],
            }),
          },
        },
      ]),
    },
  ]);
  assert.equal(messages.length, 2);
  assert.ok(messages[1].markdown.includes("const n = 42"));
  assert.ok(!messages[1].markdown.includes("web_results"));
});
test("Plain text preserves code and Unicode while removing Markdown formatting", () => {
  assert.equal(
    markdownText("## नेपाली\n\n**Hello**\n\n```js\nconst n = 42;\n```"),
    "नेपाली\n\nHello\n\nconst n = 42;",
  );
});
test("Unavailable direct data returns an explicitly partial DOM export without scrolling", async () => {
  const dom = new JSDOM(
    '<main><div data-message-author-role="user">Visible</div></main>',
    { url: "https://chatgpt.com/c/test" },
  );
  const scroller = dom.window.document.querySelector("main");
  scroller.scrollTop = 123;
  scroller.scrollTo = () => {
    throw new Error("Must never scroll");
  };
  const chat = await captureConversation(
    dom.window.document,
    dom.window.location.href,
  );
  assert.equal(scroller.scrollTop, 123);
  assert.equal(chat.capture.complete, false);
  assert.equal(chat.capture.scrolled, false);
  assert.match(chat.scope, /Partial export/);
});
