# ChatGPT & Claude Exporter – PDF & Markdown

Export conversations from ChatGPT, Claude, Gemini, Grok, DeepSeek, Qwen, Perplexity and Mistral to PDF, Markdown, JSON or plain text. Right-click a webpage to copy its loaded content as Markdown.

Everything is converted locally. No extension account, API key, analytics or export server.

## Development

Requires Node.js 20.19+ and Chrome/Edge 120+.

```sh
npm ci
npm run build
```

Load `dist/` through the browser's Extensions page with Developer mode enabled. Refresh open chat tabs after updating. Open a conversation, click Export, edit Title, choose messages and format, then download.

```sh
npm test
npx playwright install chromium
npm run test:browser
npm run test:in-page
npm run test:website
npm run package
```

`npm run package` builds a minified production extension without source maps and creates `releases/chatgpt-claude-exporter-1.0.1.zip`. The manifest is at the ZIP root. The repository contains source and tests; generated builds, browser profiles, screenshots, old releases and local checkpoints are ignored.

## Scope and limitations

- Exports the open conversation's active branch, not account-wide history.
- Reads conversation data on demand using the current provider session, without scrolling. If direct extraction fails, the current rendered messages are exported with an explicit partial-capture notice.
- Available pasted/file text is included. Images and files without accessible text use placeholders; binary attachments and hidden tool internals are excluded.
- PDFs contain selectable text, code panels and chat bubbles. Some scripts may not be supported by the bundled fonts.
- Webpage copying covers loaded page content, including navigation, tables, code and accessible frames. It does not crawl other pages or retrieve unloaded content. Browser internal pages cannot be copied.
- Provider site changes may require reader updates. Wait for an answer to finish before exporting.

## Project layout

`src/core/`: conversion and capture; `src/direct/`: provider data readers; `src/providers/`: DOM fallbacks; `src/ui/`: shared export interface; `scripts/`: build, packaging and preview; `tests/`: unit and browser fixtures; `assets/`: local icons, fonts and licenses.

See [privacy policy](PRIVACY.md), [publishing instructions](docs/PUBLISHING.md) and [store listing](docs/STORE-LISTING.md). Third-party notices accompany the production package. This is an independent extension, not affiliated with the supported AI providers.

