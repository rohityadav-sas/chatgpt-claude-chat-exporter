const messages = {
  chatgpt:
    '<div data-message-author-role="user" data-message-id="q"><div class="whitespace-pre-wrap">Keep नेपाली and code.</div></div><div data-message-author-role="assistant" data-message-id="a"><div class="markdown"><p><strong>Answer</strong></p><pre><code class="language-js">const n = 42;</code></pre></div></div>',
  claude:
    '<div data-testid="user-message">Keep नेपाली and code.</div><div data-testid="assistant-message"><div class="font-claude-response"><p><strong>Answer</strong></p><pre><code>const n = 42;</code></pre></div></div>',
  grok: '<div class="message-bubble" data-testid="user-message">Keep नेपाली and code.</div><div class="message-bubble" data-testid="assistant-message"><p><strong>Answer</strong></p><pre><code>const n = 42;</code></pre></div>',
  deepseek:
    '<div class="ds-message">Keep नेपाली and code.</div><div class="ds-message"><div class="ds-markdown ds-assistant-message-main-content"><p><strong>Answer</strong></p><pre><code>const n = 42;</code></pre></div></div>',
  gemini:
    '<user-query><div class="query-text"><p>Keep नेपाली and code.</p></div></user-query><model-response><message-content><p><strong>Answer</strong></p><pre><code>const n = 42;</code></pre></message-content></model-response>',
  qwen: '<div class="qwen-chat-message qwen-chat-message-user"><div class="chat-user-message-container">Keep नेपाली and code.</div></div><div class="qwen-chat-message qwen-chat-message-assistant"><div class="qwen-markdown"><p><strong>Answer</strong></p><pre><code>const n = 42;</code></pre></div></div>',
  perplexity:
    '<div data-renderer="lm">Keep नेपाली and code.</div><div data-renderer="lm" class="prose"><p><strong>Answer</strong></p><pre><code>const n = 42;</code></pre></div>',
  mistral:
    '<div data-message-author-role="user" data-message-id="q">Keep नेपाली and code.</div><div data-message-author-role="assistant" data-message-id="a"><div data-message-part-type="answer"><p><strong>Answer</strong></p><pre><code>const n = 42;</code></pre></div></div>',
};
const headers = {
  chatgpt:
    '<header id="page-header"><span>Sample conversation</span><div data-testid="thread-header-right-actions"><button>Upgrade</button><div><button id="native-action" data-testid="share-chat-button">Share</button></div><button>More</button></div></header>',
  claude:
    '<div data-testid="chat-header" class="top"><span>Sample conversation</span><div data-testid="wiggle-controls-actions-group"><button id="native-action" aria-label="Files">Files</button><span><button>Share</button></span></div></div>',
  grok: '<div class="top"><span>Sample conversation</span><div><button id="native-action" aria-label="More">More</button><button aria-label="Create share link">Share</button></div></div>',
  deepseek:
    '<div class="_2be88ba top"><span>Sample conversation</span><div role="button" id="native-action">Share</div></div>',
  gemini:
    '<div class="top"><span>Sample conversation</span><div class="buttons-container"><conversation-actions-icon id="native-action"><button aria-label="Open menu for conversation actions.">Menu</button></conversation-actions-icon></div></div>',
  qwen: '<header class="header-desktop"><span>Sample conversation</span><div id="qwen-chat-header-right"><button id="native-action">Share</button></div></header>',
  perplexity:
    '<div class="top"><span>Sample conversation</span><div class="actions"><div id="native-action"><button aria-label="Session actions">More</button></div><button>Share</button></div></div>',
  mistral:
    '<div class="app-shell-top-bar-0 top"><div class="title"><button>Sample conversation</button></div><div class="controls"><button id="native-action">Files</button><span><button>Share</button></span></div></div>',
};
export const cases = [
  ["chatgpt", "https://chatgpt.com/c/header-test"],
  ["claude", "https://claude.ai/chat/header-test"],
  ["grok", "https://grok.com/c/header-test"],
  ["deepseek", "https://chat.deepseek.com/a/chat/s/header-test"],
  ["gemini", "https://gemini.google.com/app/header-test"],
  ["qwen", "https://chat.qwen.ai/c/header-test"],
  ["perplexity", "https://www.perplexity.ai/search/header-test"],
  ["mistral", "https://chat.mistral.ai/work/header-test"],
];
export function fixture(provider) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Sample conversation</title><style>
  body{margin:0;font:14px system-ui;background:#fafafa;color:#242a26}header,.top{height:56px;padding:0 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e4e4e4}header>div,.top>div{display:flex;align-items:center;gap:8px}.top>.title{flex:1}button,[role=button]{font:13px system-ui;border:1px solid #ddd;background:white;border-radius:8px;padding:7px 10px;cursor:pointer}article{max-width:700px;margin:55px auto;line-height:1.7}pre{padding:16px;background:#eef1ea;border-radius:8px}.dark body{background:#151a17;color:#edf3ee}.dark header,.dark .top{border-color:#404b42}
  ._2be88ba > span{flex:1}
  </style></head><body><main>${headers[provider]}<article>${messages[provider]}</article></main></body></html>`;
}
