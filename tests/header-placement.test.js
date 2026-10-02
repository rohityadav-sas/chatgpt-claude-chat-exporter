import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { findHeaderPlacement } from "../src/ui/header-placement.js";

test("Claude inserts before both Files and Share in the header action group", () => {
  const document = new JSDOM(
    '<main><div data-testid="wiggle-controls-actions-group"><button id="files">Files</button><span><button>Share</button></span></div></main>',
  ).window.document;
  document.getElementById("files").getBoundingClientRect = () => ({
    width: 28,
    height: 28,
    top: 8,
    right: 1000,
  });
  const placement = findHeaderPlacement(document, "claude");
  assert.equal(placement.before.id, "files");
  assert.equal(
    placement.container.dataset.testid,
    "wiggle-controls-actions-group",
  );
});
test("No matching header means no arbitrary placement near a message Share button", () => {
  const document = new JSDOM(
    '<main><article><button aria-label="Share">Share answer</button></article></main>',
  ).window.document;
  for (const provider of [
    "chatgpt",
    "claude",
    "grok",
    "deepseek",
    "gemini",
    "qwen",
    "perplexity",
    "mistral",
  ])
    assert.equal(findHeaderPlacement(document, provider), null);
});
