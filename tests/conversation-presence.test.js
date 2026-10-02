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
