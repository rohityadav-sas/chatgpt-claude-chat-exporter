import test from "node:test";
import assert from "node:assert/strict";
import { captureStatus } from "../src/core/capture-status.js";
test("Failed direct reads show the actual failure instead of a generic warning", () => {
  assert.match(
    captureStatus({
      complete: false,
      reason: "Conversation request failed (403).",
    }),
    /403/,
  );
  assert.match(
    captureStatus({ complete: false, reason: "Refresh this chat." }),
    /Refresh this chat/,
  );
  assert.equal(captureStatus({ complete: true }), "");
});
