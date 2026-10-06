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
 return Array.from(document.querySelectorAll(selectors[provider] || 'main [data-message-role]')).some(node =>
   !node.closest('[data-ai-chat-exporter], form, [contenteditable="true"]') &&
   (node.textContent.trim() || node.querySelector('img, video, audio, [data-testid*="attachment"]')),
 );
}
