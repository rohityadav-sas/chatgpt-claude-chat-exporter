import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { extractConversation } from "../src/core/extract.js";

export function checkProvider(name, url, html) {
  test(`${name}: extracts ordered turns and excludes composer/sidebar`, () => {
    const document = new JSDOM(
      `<title>Test</title><aside>Sidebar</aside><main>${html}<textarea>Unsent draft</textarea></main>`,
    ).window.document;
    const chat = extractConversation(document, url);
    assert.deepEqual(
      chat.messages.map((message) => message.role),
      ["user", "assistant", "user"],
    );
    assert.ok(chat.messages[1].markdown.includes("**Answer**"));
    assert.equal(chat.messages[0].text, "Question");
    assert.equal(chat.messages[2].text, "Question");
    assert.ok(!JSON.stringify(chat).includes("Unsent draft"));
  });
}
checkProvider(
  "Claude",
  "https://claude.ai/chat/test",
  '<div data-testid="user-message"><p>Question</p></div><div data-testid="assistant-message"><h2 class="sr-only">Claude</h2><div class="font-claude-response"><p><strong>Answer</strong></p></div><button>Copy</button></div><div data-testid="user-message"><p>Question</p></div>',
);
checkProvider(
  "Grok",
  "https://grok.com/c/test",
  '<div data-testid="user-message">Question</div><div data-testid="assistant-message"><div class="thinking-container">Thinking…</div><div class="response-content-markdown"><p><strong>Answer</strong></p></div><button>Copy</button></div><div data-testid="user-message">Question</div>',
);
checkProvider(
  "DeepSeek",
  "https://chat.deepseek.com/a/chat/s/test",
  '<div class="ds-message"><div>Question</div></div><div class="ds-message"><div class="ds-markdown">Thinking…</div><div class="ds-markdown ds-assistant-message-main-content"><p><strong>Answer</strong></p></div><button>Copy</button></div><div class="ds-message"><div>Question</div></div>',
);
checkProvider(
  "Gemini",
  "https://gemini.google.com/app/test",
  '<user-query><div class="query-text"><h5 class="cdk-visually-hidden">You said</h5><p>Question</p></div></user-query><model-response><message-content><p><strong>Answer</strong></p></message-content><button>Like</button></model-response><user-query><div class="query-text"><p>Question</p></div></user-query>',
);
checkProvider(
  "Qwen",
  "https://chat.qwen.ai/c/test",
  '<div class="chat-user-message-container"><div class="chat-user-message">Question</div></div><div class="qwen-chat-message qwen-chat-message-assistant"><div class="qwen-markdown"><p><strong>Answer</strong></p></div><button>Copy</button></div><div class="chat-user-message-container"><div class="chat-user-message">Question</div></div>',
);
checkProvider(
  "Perplexity",
  "https://www.perplexity.ai/search/test",
  '<div data-renderer="lm"><p>Question</p></div><div class="prose" data-renderer="lm"><p><strong>Answer</strong></p></div><div data-renderer="lm"><p>Question</p></div>',
);
checkProvider(
  "Mistral",
  "https://chat.mistral.ai/work/test",
  '<div data-message-author-role="user"><p>Question</p></div><div data-message-author-role="assistant"><div data-message-part-type="answer"><p><strong>Answer</strong></p></div><button>Copy</button></div><div data-message-author-role="user"><p>Question</p></div>',
);
