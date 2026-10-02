# Whole-page Markdown copying

## Independent design

A context-menu click grants on-demand activeTab access. A small injected bundle converts the current loaded document locally. It builds a detached copy while pruning scripts, styles, hidden attributes, editable controls and the extension itself. The live page is never modified. Turndown preserves Markdown structure, with explicit code-fence and table rules. Relative links and images resolve against each source document's base URI. Only Markdown crosses the extension messaging boundary; a lightweight offscreen document writes it to the clipboard and the page shows brief confirmation.

## Comparison with the supplied website-to-md code

| Detail | Supplied code | Implemented approach |
| --- | --- | --- |
| Conversion location | HTML returned to popup, reparsed there | Converted in the page; only final Markdown transferred |
| Scope | Selects article/main and removes navigation, aside, footer | Entire loaded body, including navigation and footer |
| DOM handling | Deep clone, multiple selector passes, HTML serialization | One pruning copy walk plus Markdown conversion |
| Clipboard UX | Convert in popup, then click Copy | One context-menu action |
| State storage | Last conversion saved locally | No stored page content |
| Frames | Accessible frames collected, appended at the end | Accessible frames included in their original position; inaccessible frames linked |
| Figures | Custom figure/caption rule | Standard image conversion plus caption text retained |
| Code and tables | Turndown defaults | Collision-safe fences, language labels and Markdown tables |
| Permissions | activeTab, scripting, storage | Existing activeTab/scripting plus contextMenus and clipboardWrite; no universal persistent host grant |

Useful ideas adopted from the reference: accessible iframe extraction and preserving figure captions. The implementation uses the already installed Turndown package, not the bundled reference library. Article-only extraction was deliberately omitted to satisfy whole-page copying. Reference source: C:/Users/Rohit/Downloads/website-to-md/js/popup.js (MIT stated in its README).

## Boundaries

Copies the current loaded page, not every linked page of a website. No crawling, network fetching, automatic scrolling, screenshot OCR or expansion of unloaded virtualized content. Closed shadow roots and inaccessible frame documents cannot be read. Browser internal pages and extension stores restrict injection. Known hidden attributes and inline hidden styles are pruned without a computed-style read for every node.

## Validation

Unit fixtures cover complete body scope, relative URLs, tables, code, hidden elements, read-only DOM handling, open shadow roots and accessible iframes. Browser fixtures register the real context menu and invoke its shared handler through a test-only hook, with a fixture-only host grant (native context-menu selection itself is not automated). Actual offscreen clipboard contents are checked in Chromium and Edge. Small-fixture end-to-end measurements were 56-72ms, including copy. These are fixture measurements, not a universal speed guarantee. Existing chat/PDF browser checks also passed after the offscreen loader change.
