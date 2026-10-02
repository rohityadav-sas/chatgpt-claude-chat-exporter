import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { qwenTitle } from "../src/core/qwen-title.js";
const url = "https://chat.qwen.ai/c/active";
test("Qwen reads the matching chat sidebar title rather than another chat or the model", () => {
  const document = new JSDOM(
    '<title>Qwen</title><header>Qwen3.7-Plus</header><a href="/c/other">Wrong conversation</a><a href="/c/active"><span class="truncate">AI Capabilities Overview</span><button>More</button></a>',
  ).window.document;
  assert.equal(qwenTitle(document, url), "AI Capabilities Overview");
  assert.equal(qwenTitle(document, "https://chat.qwen.ai/c/missing"), "");
});
test("Qwen matches state metadata to the current conversation ID", () => {
  const document = new JSDOM("<title>Qwen</title>").window.document;
  assert.equal(
    qwenTitle(document, url, [
      {
        chats: [
          { id: "other", title: "Wrong" },
          { id: "active", title: "State title" },
        ],
      },
    ]),
    "State title",
  );
  assert.equal(qwenTitle(document, url, [{ chats: {} }]), "");
});

test("Qwen saved sidebar title overrides stale first-prompt state title", () => {
  const document = new JSDOM(
    '<title>Qwen</title><a href="/c/active"><span class="truncate">AI Capabilities Overview</span><button>More</button></a>',
  ).window.document;
  assert.equal(
    qwenTitle(document, url, [
      { currentChat: { id: "active", title: "what are you capable of?" } },
    ]),
    "AI Capabilities Overview",
  );
});

test("Qwen href-less active sidebar link wins over stale prompt state", () => {
  const document = new JSDOM(
    '<title>Qwen</title><div class="sidebar-new-list-content"><div class="session-list"><a aria-label="chat-item" class="chat-item-drag-link"><span class="chat-item-title-text">Other conversation</span></a><a aria-label="chat-item" class="chat-item-drag-link chat-item-drag-active"><div class="chat-item-drag-link-content"><div class="chat-item-drag-link-content-tip-text"><span class="chat-item-title-text">AI Capabilities Overview</span></div></div></a></div></div>',
  ).window.document;
  assert.equal(
    qwenTitle(document, url, [
      { currentChat: { id: "active", title: "what are you capable of?" } },
    ]),
    "AI Capabilities Overview",
  );
});
