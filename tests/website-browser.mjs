import { chromium } from "@playwright/test";
import { cp, readFile, writeFile, mkdtemp } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
const root = process.cwd();
const extension = await mkdtemp(
  path.join(root, "artifacts/website-extension-"),
);
await cp("dist", extension, { recursive: true });
const manifest = JSON.parse(
  await readFile(path.join(extension, "manifest.json"), "utf8"),
);
manifest.host_permissions.push("https://website.test/*");
await writeFile(
  path.join(extension, "manifest.json"),
  JSON.stringify(manifest),
);
const backgroundPath = path.join(extension, "background.js");
// Capture the registered click handler in the test copy, without relying on minified names.
const code = `const originalAddListener = chrome.contextMenus.onClicked.addListener.bind(chrome.contextMenus.onClicked);
chrome.contextMenus.onClicked.addListener = (handler) => { globalThis.testWebsiteClick = handler; originalAddListener(handler); };\n` + await readFile(backgroundPath, "utf8");
await writeFile(backgroundPath, code);
const context = await chromium.launchPersistentContext(
  await mkdtemp(path.join(root, "artifacts/website-profile-")),
  {
    channel: process.env.EXPORTER_BROWSER || "chromium",
    headless: true,
    args: [
      "--disable-extensions-except=" + extension,
      "--load-extension=" + extension,
    ],
  },
);
try {
  await context.grantPermissions(["clipboard-read"], {
    origin: "https://website.test",
  });
  const page = await context.newPage();
  await page.route("https://website.test/**", (r) =>
    r.fulfill({
      contentType: "text/html",
      body: "<title>Clipboard fixture</title><nav>Nav text</nav><h1>Whole page</h1><p>COPY_REAL_CLIPBOARD</p><footer>Footer text</footer>",
    }),
  );
  await page.goto("https://website.test/page");
  const worker =
    context.serviceWorkers()[0] ||
    (await context.waitForEvent("serviceworker"));
  await worker.evaluate(async () => {
    await chrome.contextMenus.update("copy-website-markdown", {
      title: "Copy website as Markdown",
    });
  });
  const start = Date.now();
  await worker.evaluate(async () => {
    const tabs = await chrome.tabs.query({ url: "https://website.test/*" });
    globalThis.testWebsiteClick({ menuItemId: "copy-website-markdown" }, tabs[0]);
  });
  await page.locator('[data-ai-chat-exporter="website-toast"]').screenshot({path:"artifacts/website-toast.png"});
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(
    clipboard.replaceAll("\\", "").includes("COPY_REAL_CLIPBOARD") &&
      clipboard.includes("Nav text") &&
      clipboard.includes("Footer text"),
  );
  console.log(
    "PASS: registered context menu, actual conversion and offscreen clipboard copy in " +
      (Date.now() - start) +
      "ms (fixture)",
  );
} finally {
  await context.close();
}
