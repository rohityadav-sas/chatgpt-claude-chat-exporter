import test from "node:test";
import assert from "node:assert/strict";
import { MessageSelection } from "../src/core/selection.js";
const messages = [
  { id: "duplicate", role: "user", markdown: "same", text: "same" },
  { id: "a", role: "assistant", markdown: "answer", text: "answer" },
  { id: "duplicate", role: "user", markdown: "same", text: "same" },
  { id: "b", role: "assistant", markdown: "last", text: "last" },
];
const chat = {
  messages,
  scope: "Complete active branch.",
  capture: { complete: true, scrolled: false },
};
test("Message selection preserves order and treats identical messages separately", () => {
  const selection = new MessageSelection(messages);
  selection.select("none");
  selection.toggle(2, true);
  selection.toggle(0, true);
  const result = selection.apply(chat);
  assert.deepEqual(result.messages, [messages[0], messages[2]]);
  assert.deepEqual(result.selection, { selected: 2, total: 4 });
  assert.equal(result.capture.complete, true);
  assert.equal(chat.messages.length, 4);
});
test("All, Human, Assistant, None and Invert produce the expected selections", () => {
  const selection = new MessageSelection(messages);
  assert.equal(selection.count, 4);
  selection.select("user");
  assert.deepEqual([...selection.indices], [0, 2]);
  selection.select("invert");
  assert.deepEqual([...selection.indices], [1, 3]);
  selection.select("assistant");
  assert.deepEqual([...selection.indices], [1, 3]);
  selection.select("none");
  assert.throws(() => selection.apply(chat), /at least one/);
  selection.select("invert");
  assert.equal(selection.count, 4);
  selection.select("all");
  assert.equal(selection.count, 4);
});
