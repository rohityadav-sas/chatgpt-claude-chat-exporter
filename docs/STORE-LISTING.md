# Store listing

Name: ChatGPT & Claude Exporter – PDF & Markdown

Summary: Export AI conversations to Markdown, JSON, Text and PDF

Category: Workflow & Planning

## Description

Save AI conversations as clean PDFs, Markdown, JSON or plain text. Choose individual messages or export the whole active conversation.

Works with ChatGPT, Claude, Gemini, Grok, DeepSeek, Qwen, Perplexity and Mistral.

- Export ChatGPT conversations to PDF or Markdown.
- Save Claude chats with available pasted text and readable code blocks.
- Download chat-style PDFs with user and AI messages, original provider icons and selectable text.
- Select exactly which messages to keep.
- Copy a loaded webpage as Markdown from the right-click menu.
- Convert locally without an extension account, analytics or an export server.

Conversation extraction runs on demand using your existing provider session. If complete conversation data is unavailable, the extension clearly identifies a partial export of rendered messages. Binary attachments, unloaded page content and hidden tool internals are not exported.

Independent extension. Not affiliated with OpenAI, Anthropic or other supported AI providers.

## Privacy tab

Single purpose: Save user-selected conversation and webpage content as portable documents locally.

activeTab: Grants temporary access to the webpage selected through the toolbar or context-menu gesture.
scripting: Runs bundled extraction code to read selected page content and provider conversation data.
host_permissions: Limited to supported AI sites; required to display Export and read the active conversation using the existing session.
offscreen: Creates a hidden local document for PDF generation and clipboard writing.
downloads: Saves generated PDF files directly to the user's device.
contextMenus: Provides Copy website as Markdown on webpages.
clipboardWrite: Writes the requested Markdown to the clipboard.

Remote code: No. All executable code is bundled.
Developer collection/transmission: None. Page and chat content is processed locally; provider requests remain with the current provider. Review the dashboard disclosures together with PRIVACY.md before submission.
