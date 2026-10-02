import { websiteMarkdown } from "./core/website-markdown.js";
globalThis.__websiteMarkdownResult = (() => {
  try {
    return websiteMarkdown(document);
  } catch (error) {
    return { error: error.message };
  }
})();
