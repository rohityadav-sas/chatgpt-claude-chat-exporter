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

test("ChatGPT newer header can anchor to Share without the old action-group test id", () => {
  for (const markup of [
    '<header><div><button aria-label="Share">Share</button><button>More</button></div></header>',
    "<nav><div><button>Share</button><button>More</button></div></nav>",
    '<div class="toolbar"><div role="button" aria-label="Share conversation">Share</div></div>',
    '<div id="page-header"><div><button data-testid="share-chat-button">Share</button></div></div>',
  ]) {
    const document = new JSDOM(markup).window.document;
    const share = document.querySelector("button, [role=button]");
    share.getBoundingClientRect = () => ({
      width: 64,
      height: 32,
      top: 8,
      right: 1000,
    });
    const placement = findHeaderPlacement(document, "chatgpt");
    assert.equal(placement.before, share);
    assert.equal(placement.container, share.parentElement);
  }
});
