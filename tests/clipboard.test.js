import test from "node:test";
import assert from "node:assert/strict";
import { writeClipboard } from "../src/core/clipboard.js";

test("Firefox copies exact Unicode text directly without creating a hidden selection document", async () => {
  const text = 'User\nनमस्ते\n{"answer":true}';
  let copied;
  const result = await writeClipboard(
    text,
    () => {
      throw Error("Must not create tools frame");
    },
    {},
    {
      writeText: async (value) => {
        copied = value;
      },
    },
  );
  assert.equal(copied, text);
  assert.deepEqual(result, { success: true });
  await assert.rejects(
    writeClipboard(
      text,
      () => {},
      {},
      {
        writeText: async () => {
          throw Error("Denied");
        },
      },
    ),
    /Denied/,
  );
});

test("Chrome retains its offscreen clipboard route", async () => {
  const calls = [];
  const result = await writeClipboard(
    "hello",
    async () => {
      calls.push("ready");
    },
    {
      offscreen: {},
      runtime: {
        sendMessage: async (message) => {
          calls.push(message);
          return { success: true };
        },
      },
    },
  );
  assert.deepEqual(calls, [
    "ready",
    { type: "ai-chat-exporter:copy-clipboard", text: "hello" },
  ]);
  assert.equal(result.success, true);
});
