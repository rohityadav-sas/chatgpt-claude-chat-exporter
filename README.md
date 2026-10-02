<p align="center">
  <img src="docs/media/banner.svg" alt="AI Chat Exporter — Keep the conversation. Take it anywhere." width="100%" />
</p>

<div align="center">

**ChatGPT & Claude Exporter – PDF & Markdown**

Export AI conversations to Markdown, JSON, Text and PDF

![Manifest V3](https://img.shields.io/badge/Chrome-Manifest_V3-255c46?style=flat-square&logo=googlechrome&logoColor=white)
![Local processing](https://img.shields.io/badge/Privacy-Local_processing-255c46?style=flat-square)
![Formats](https://img.shields.io/badge/Export-4_formats-255c46?style=flat-square)
![Providers](https://img.shields.io/badge/AI-8_providers-255c46?style=flat-square)

[Get started](#get-started) · [Features](#made-for-the-chats-worth-keeping) · [Develop](#build-something-good) · [Privacy](PRIVACY.md)

</div>

<br />

## One extension. Your favorite AI.

<img src="docs/media/providers.svg" alt="ChatGPT, Claude, Gemini, Grok, DeepSeek, Qwen, Perplexity and Mistral" width="100%" />

Save the conversation you have open, choose the messages that matter, and take them into your notes, documents or next project.

## Four ways to keep it

<img src="docs/media/formats.svg" alt="PDF, Markdown, JSON and plain text export formats" width="100%" />

## Made for the chats worth keeping

| | What you get |
| :--- | :--- |
| **💬 Chat-style PDFs** | User and AI bubbles, original provider icons, readable code panels and selectable text. |
| **☑️ Choose your messages** | Keep the whole active conversation or select individual messages. User, AI and Invert filters make it quick. |
| **📎 Pasted text included** | Available pasted and attachment text stays distinguishable inside its original message. |
| **🌐 Webpage → Markdown** | Right-click a webpage to copy its loaded content, including links, tables, code and accessible frames. |
| **🔒 Local by design** | Conversion happens in your browser. No extension account, API key, analytics or export server. |
| **✨ Thoughtful details** | A compact export panel, colored SVG icons, gentle transitions and reduced-motion support. |

## Get started

**Build once, then load into Chrome or Edge.** Requires Node.js 20.19+ and Chrome/Edge 120+.

```sh
npm ci
npm run build
```

1. Open `chrome://extensions` or `edge://extensions` and enable **Developer mode**.
2. Choose **Load unpacked**, then select the project's `dist` folder.
3. Open an AI conversation and click **Export** in the conversation header.
4. Edit the title, choose messages and a format, then export.

For webpage copying, right-click a regular webpage and choose **Copy website as Markdown**. Refresh open chat tabs after updating the extension.

> **A small privacy detail with a big difference:** your exports stay on your device. Conversation requests go to the AI provider you are already using, through your existing browser session.

## Build something good

```sh
npm test
npx playwright install chromium
npm run test:browser
npm run test:in-page
npm run test:website
npm run package
```

`npm run package` produces a minified upload ZIP in `releases/`, with the manifest at its root and no source maps. Generated builds, browser profiles, screenshots, old releases and local checkpoints stay out of Git.

<details>
<summary><strong>Explore the source</strong></summary>

| Directory | Purpose |
| :--- | :--- |
| `src/core/` | Capture dispatch, Markdown conversion and PDF layout |
| `src/direct/` | Provider API and page-state readers |
| `src/providers/` | Provider-specific DOM fallbacks |
| `src/ui/` | Shared export controls, icons and motion |
| `assets/` | Local fonts, SVG artwork and licenses |
| `tests/` | Unit checks and real browser fixtures |
| `scripts/` | Build, packaging and development preview |
| `docs/` | Publishing guidance and README artwork |

</details>

<details>
<summary><strong>Know the capture boundaries</strong></summary>

- Exports the open conversation's active branch, not account-wide history or alternate answers.
- Reads conversation data on demand without scrolling. When direct extraction fails, the current rendered messages are exported with an explicit partial-capture notice.
- Available pasted/file text is included. Images and inaccessible files use placeholders; binary attachments and hidden tool internals are excluded.
- Some scripts may not be supported by the bundled PDF fonts.
- Webpage copying covers loaded content. It does not crawl linked pages or retrieve unloaded content; browser internal pages cannot be copied.
- Provider changes may require reader updates. Wait for an answer to finish before exporting.

</details>

<br />

<div align="center">

**Keep what matters.**

[Privacy policy](PRIVACY.md) · [Publishing guide](docs/PUBLISHING.md) · [Store listing](docs/STORE-LISTING.md) · [Third-party notices](THIRD-PARTY-NOTICES.txt)

<sub>Independent extension. Not affiliated with OpenAI, Anthropic or the other supported AI providers.<br />Provider marks retain their original artwork and colors. README wave animation is decorative; its static frame remains readable.</sub>

</div>
