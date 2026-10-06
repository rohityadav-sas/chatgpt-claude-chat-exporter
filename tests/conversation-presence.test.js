import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { cases, fixture } from "./in-page-fixtures.mjs";
import { hasConversation } from "../src/core/conversation-presence.js";
for(const [provider] of cases) test(provider + " hides Export with no conversation and shows it with turns", () => {
 const document = new JSDOM(fixture(provider)).window.document;
 assert.equal(hasConversation(document,provider),true);
 document.querySelector("article").replaceChildren();
 assert.equal(hasConversation(document,provider),false);
});

test("ChatGPT recognizes rendered turns without the legacy author attribute", () => {
 for (const attributes of ['data-testid="conversation-turn-0"', 'data-turn="user"', 'data-turn="assistant"']) {
  const document = new JSDOM(`<main><article ${attributes}><p>A conversation message</p></article></main>`).window.document;
  assert.equal(hasConversation(document, "chatgpt"), true);
  document.querySelector("article").replaceChildren();
  assert.equal(hasConversation(document, "chatgpt"), false);
 }
});

test("ChatGPT ignores sidebar chat history and composer content", () => {
 const document = new JSDOM('<aside><article data-testid="conversation-turn-0">Saved chat</article></aside><main><form><article data-turn="user">Draft</article></form></main>').window.document;
 assert.equal(hasConversation(document, "chatgpt"), false);
});
