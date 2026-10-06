// Require rendered conversation content, not merely a saved-chat URL or header.
const selectors = {
 chatgpt: '[data-message-author-role="user"], [data-message-author-role="assistant"], main [data-testid^="conversation-turn-"], main article[data-turn="user"], main article[data-turn="assistant"]',
 claude: '[data-testid="user-message"], [data-testid="assistant-message"]',
 grok: '.message-bubble, [data-testid="user-message"], [data-testid="assistant-message"]',
 deepseek: '.ds-message',
 gemini: 'user-query, model-response',
 qwen: '.qwen-chat-message, main [data-message-role]',
 perplexity: 'main [data-renderer="lm"]',
 mistral: '[data-message-author-role="user"], [data-message-author-role="assistant"]',
};
export function hasConversation(document, provider) {
 const rendered = Array.from(document.querySelectorAll(selectors[provider] || 'main [data-message-role]')).some(node =>
   !node.closest('[data-ai-chat-exporter], form, [contenteditable="true"]') &&
   (node.textContent.trim() || node.querySelector('img, video, audio, [data-testid*="attachment"]')),
 );
 if (rendered) return true;
 // Some ChatGPT layouts omit all turn/author attributes. A rendered response
 // still has a message-level Share control, distinct from the header action.
 // Require a saved conversation and a visible response control, never URL alone.
 if (provider !== "chatgpt" || !/^\/c\/[^/]+/.test(document.location.pathname)) return false;
 return Array.from(document.querySelectorAll('button[aria-label="Share"]')).some(node => {
   if (node.closest('aside, nav, header, form, [contenteditable="true"], [data-ai-chat-exporter]')) return false;
   const rect = node.getBoundingClientRect();
   return rect.width > 0 && rect.height > 0 && rect.top >= 120 &&
     rect.top < document.defaultView.innerHeight;
 });
}
