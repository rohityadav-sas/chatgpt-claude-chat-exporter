import test from "node:test";
import assert from "node:assert/strict";
import { createExport } from "../src/core/formats.js";
const chat = {
  title: "CON",
  url: "https://chatgpt.com/c/test",
  exportedAt: "2026-10-02T00:00:00Z",
  scope: "Active branch",
  messages: [{ role: "user", markdown: "Hello", text: "Hello" }],
};
test("Filenames are portable and format choices are validated", () => {
  assert.equal(createExport(chat, "json").filename, "chat-CON.json");
  assert.equal(
    createExport({ ...chat, title: "a/b:c?d" }, "txt").filename,
    "a-b-c-d.txt",
  );
  assert.throws(() => createExport(chat, "exe"), /Unknown export/);
});

test("Every provider uses consistent speaker names in portable exports", () => {
  for (const [provider, name] of Object.entries({ chatgpt: "ChatGPT", claude: "Claude", grok: "Grok", deepseek: "DeepSeek", gemini: "Gemini", qwen: "Qwen", perplexity: "Perplexity", mistral: "Mistral" })) {
    const value = { ...chat, provider, messages: [...chat.messages, { role: "assistant", markdown: "Reply", text: "Reply" }] };
    assert.ok(createExport(value, "md").content.includes(`## User`));
    assert.ok(createExport(value, "md").content.includes(`## ${name}`));
    assert.ok(createExport(value, "txt").content.includes(`${name}\nReply`));
    const result = JSON.parse(createExport(value, "json").content);
    assert.deepEqual(result.messages.map(m => m.speaker), ["User", name]);
    assert.deepEqual(result.messages.map(m => m.role), ["user", "assistant"]);
  }
});
