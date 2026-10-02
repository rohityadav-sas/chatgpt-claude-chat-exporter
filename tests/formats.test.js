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
