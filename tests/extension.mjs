import { assertPdfDownload } from "./pdf-download-helper.mjs";
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { readFile, mkdir, cp, writeFile, mkdtemp } from "node:fs/promises";
import path from "node:path";
const root = process.cwd();
await mkdir("artifacts", { recursive: true });
// The test copy grants only the intercepted fixture host so the actual scripting
// API can be exercised without a physical toolbar click. Shipping manifest is unchanged.
const rootLayout = process.argv.includes("--root");
const testExtension = rootLayout
  ? "artifacts/test-extension-root"
  : "artifacts/test-extension";
await cp("dist", rootLayout ? `${testExtension}/dist` : testExtension, {
  recursive: true,
});
if (rootLayout)
  await cp("assets", `${testExtension}/assets`, { recursive: true });
const manifest = JSON.parse(
  await readFile(rootLayout ? "manifest.json" : "dist/manifest.json", "utf8"),
);
manifest.host_permissions = ["https://chatgpt.com/*"];
await writeFile(`${testExtension}/manifest.json`, JSON.stringify(manifest));
const profile = await mkdtemp(path.join(root, "artifacts/test-profile-"));
const context = await chromium.launchPersistentContext(profile, {
  channel: "chromium",
  headless: true,
  acceptDownloads: true,
  args: [
    `--disable-extensions-except=${path.join(root, testExtension)}`,
    `--load-extension=${path.join(root, testExtension)}`,
  ],
});
try {
  // chrome://extensions exposes the real unpacked extension ID in its shadow DOM.
  const management = await context.newPage();
  await management.goto("chrome://extensions");
  const item = management
    .locator("extensions-item")
    .filter({ hasText: manifest.name });
  await item.waitFor();
  const id = await item.getAttribute("id");
  assert.ok(id);
  const fixture = await context.newPage();
  await fixture.route("https://chatgpt.com/**", (route) =>
    route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: '<title>Browser test - ChatGPT</title><main><div data-message-author-role="user"><div class="whitespace-pre-wrap">Keep à¤¨à¥‡à¤ªà¤¾à¤²à¥€ &amp; Unicode</div></div><div data-message-author-role="assistant"><div class="markdown"><h2>Answer</h2><p><strong>Formatting</strong> survives.</p><pre><code class="language-js">const n = 42;</code></pre><table><tr><th>One</th><th>Two</th></tr><tr><td>1</td><td>2</td></tr></table></div></div></main>',
    }),
  );
  await fixture.goto("https://chatgpt.com/c/test");
  const popup = await context.newPage();
  const startupErrors = [];
  popup.on("pageerror", (error) => startupErrors.push(error.message));
  await popup.goto(`chrome-extension://${id}/${manifest.action.default_popup}`);
  await popup.getByText("Open a supported conversation").waitFor();
  assert.deepEqual(startupErrors, []);
  // Validate the actual packaged script in Chromium, independently of popup mocks.
  const bundle = await readFile("dist/content.js", "utf8");
  const extracted = await fixture.evaluate(bundle);
  assert.equal(extracted.conversation.messages.length, 2);
  assert.ok(extracted.conversation.messages[0].text.includes("à¤¨à¥‡à¤ªà¤¾à¤²à¥€"));
  const fixtureTab = await popup.evaluate(async () =>
    (await chrome.tabs.query({})).find((tab) =>
      tab.url?.startsWith("https://chatgpt.com"),
    ),
  );
  assert.ok(fixtureTab);
  // Only active-tab selection is replaced because the popup is opened as a tab.
  // Extraction now uses the real chrome.scripting API against the routed fixture.
  await popup.addInitScript((tab) => {
    chrome.tabs.query = async () => [tab];
  }, fixtureTab);
  await popup.reload();
  await popup.getByText("ChatGPT \u00b7 supported").waitFor();
  await popup.reload();
  await popup
    .getByText("2 messages \u00b7 1 from you")
    .waitFor({ state: "attached" });
  for (const format of ["md", "json", "txt"]) {
    await popup.locator(`input[value="${format}"]`).check();
    const downloadPromise = popup.waitForEvent("download");
    await popup.locator("#export").click();
    const download = await downloadPromise;
    const target = path.join(root, "artifacts", download.suggestedFilename());
    await download.saveAs(target);
    const data = await readFile(target, "utf8");
    assert.ok(data.includes("à¤¨à¥‡à¤ªà¤¾à¤²à¥€"));
    if (format === "json") assert.equal(JSON.parse(data).messages.length, 2);
  }
  await popup.locator('input[value="pdf"]').check();
  await popup.locator("body").screenshot({ path: "artifacts/popup.png" });
  await assertPdfDownload(
    context,
    () => popup.locator("#export").click(),
    "artifacts/conversation.pdf",
  );
  // A long transcript and code block paginate without opening a viewer.
  await assertPdfDownload(
    context,
    () =>
      popup.evaluate(async () => {
        const messages = Array.from({ length: 59 }, (_, index) => ({
          role: index % 2 ? "assistant" : "user",
          markdown:
            "Message " +
            index +
            " à¤¨à¥‡à¤ªà¤¾à¤²à¥€\n\n" +
            "A readable paragraph with preserved words. ".repeat(100),
        }));
        messages.push({
          role: "assistant",
          markdown:
            "\x60\x60\x60js\n" +
            Array.from(
              { length: 100 },
              (_, i) => "const line" + i + " = " + i + ";",
            ).join("\n") +
            "\n\x60\x60\x60",
        });
        const result = await chrome.runtime.sendMessage({
          type: "ai-chat-exporter:open-pdf",
          conversation: {
            title: "Long PDF test",
            provider: "chatgpt",
            url: "https://chatgpt.com/c/test",
            scope: "Selected messages",
            exportedAt: new Date().toISOString(),
            messages,
          },
        });
        if (!result?.success) throw new Error(result?.error);
      }),
    "artifacts/long-conversation.pdf",
  );
  assert.ok(
    (await readFile("artifacts/long-conversation.pdf", "latin1")).match(
      /\/Type \/Page\b/g,
    ).length > 5,
  );
  // An attached prior conversation must remain inside its card across pages.
  await assertPdfDownload(
    context,
    () =>
      popup.evaluate(async () => {
        const result = await chrome.runtime.sendMessage({
          type: "ai-chat-exporter:download-pdf",
          conversation: {
            title: "Pasted conversation layout",
            provider: "claude",
            url: "https://claude.ai/chat/test",
            scope: "Selected messages",
            exportedAt: new Date().toISOString(),
            messages: [
              {
                role: "user",
                markdown: "Continue this chat",
                bodyMarkdown: "Continue this chat",
                attachments: [
                  {
                    name: "Pasted text",
                    text:
                      "# Earlier conversation\n\n" +
                      Array.from(
                        { length: 35 },
                        (_, i) =>
                          "## Turn " +
                          i +
                          "\n\n" +
                          "Full attached conversation text. ".repeat(90),
                      ).join("\n\n") +
                      "\n\nATTACHMENT_END_MARKER",
                  },
                ],
              },
            ],
          },
        });
        if (!result?.success) throw new Error(result?.error);
      }),
    "artifacts/pasted-layout.pdf",
  );
  // Simulate a real virtualized transcript: only four turns exist at a time.
  await fixture.route("https://chatgpt.com/c/virtual", (route) =>
    route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: `<!doctype html><title>Virtual transcript</title><main style="height:240px;overflow-y:auto"><div id="space" style="height:3200px;position:relative"></div></main><script>
    const scroller=document.querySelector('main'); const space=document.getElementById('space');
    function render(){ const start=Math.max(0,Math.floor(scroller.scrollTop/160)-1);space.replaceChildren();for(let i=start;i<Math.min(20,start+4);i++){const node=document.createElement('div');node.dataset.messageAuthorRole=i%2?'assistant':'user';node.dataset.messageId='virtual-'+i;node.style.cssText='position:absolute;top:'+i*160+'px;height:160px';node.textContent='Repeated message';space.append(node);}}
    scroller.addEventListener('scroll',render);scroller.scrollTop=2960;render();
  </script>`,
    }),
  );
  await fixture.goto("https://chatgpt.com/c/virtual");
  await fixture.route("https://chatgpt.com/api/auth/session", (route) =>
    route.fulfill({ json: { accessToken: "fixture-only-token" } }),
  );
  await fixture.route(
    "https://chatgpt.com/backend-api/conversation/virtual",
    (route) => {
      const mapping = { root: { id: "root", parent: null } };
      for (let i = 0; i < 20; i++)
        mapping[`virtual-${i}`] = {
          id: `virtual-${i}`,
          parent: i ? `virtual-${i - 1}` : "root",
          message: {
            id: `virtual-${i}`,
            author: { role: i % 2 ? "assistant" : "user" },
            content: { parts: ["Repeated message"] },
          },
        };
      return route.fulfill({
        json: {
          title: "Complete virtual history",
          mapping,
          current_node: "virtual-19",
        },
      });
    },
  );
  await fixture.bringToFront();
  const originalScroll = await fixture
    .locator("main")
    .evaluate((node) => node.scrollTop);
  await fixture.evaluate(() => {
    window.exportScrollEvents = 0;
    document.addEventListener(
      "scroll",
      () => window.exportScrollEvents++,
      true,
    );
  });
  await popup.reload();
  await popup
    .getByText("20 messages \u00b7 10 from you")
    .waitFor({ state: "attached" });
  const virtualCapture = await popup.evaluate(
    async (tabId) =>
      (
        await chrome.scripting.executeScript({
          target: { tabId },
          files: [new URL(".", location.href).pathname.slice(1) + "content.js"],
        })
      )[0].result,
    fixtureTab.id,
  );
  assert.equal(virtualCapture.conversation.messages.length, 20);
  assert.equal(virtualCapture.conversation.capture.complete, true);
  assert.equal(await fixture.evaluate(() => window.exportScrollEvents), 0);
  assert.equal(
    await fixture.locator("main").evaluate((node) => node.scrollTop),
    originalScroll,
  );
  assert.equal(
    new Set(virtualCapture.conversation.messages.map((message) => message.id))
      .size,
    20,
  );
  await popup.getByRole("button", { name: /Select messages/ }).click();
  await popup.getByRole("button", { name: "User", exact: true }).click();
  await popup.locator(".format-trigger").click();
  await popup.getByRole("option", { name: "JSON", exact: true }).click();
  assert.equal(
    await popup.locator('input[name="format"]:checked').inputValue(),
    "json",
  );
  const selectionDownloadPromise = popup.waitForEvent("download");
  await popup.locator("#export").click();
  const selectionDownload = await selectionDownloadPromise;
  await selectionDownload.saveAs("artifacts/popup-selected.json");
  const selectedChat = JSON.parse(
    await readFile("artifacts/popup-selected.json", "utf8"),
  );
  assert.equal(selectedChat.messages.length, 10);
  assert.ok(selectedChat.messages.every((message) => message.role === "user"));
  await popup
    .getByRole("checkbox", { name: "Select all messages", exact: true })
    .check();
  await popup
    .getByRole("checkbox", { name: "Select all messages", exact: true })
    .uncheck();
  assert.equal(await popup.locator("#export").isDisabled(), true);
  await popup.getByRole("button", { name: "Invert", exact: true }).click();
  assert.equal(await popup.locator(".selection-badge").textContent(), "20/20");
  await popup.locator("#copy").click();
  await popup.waitForFunction(() => document.querySelector("#copy svg path")?.getAttribute("d") === "m5 12 4 4L19 6");
  assert.equal(await popup.getByText("Copied.", { exact: true }).count(), 0);
  const widths = await popup.locator(".export-actions").evaluate(node => [node.querySelector("#copy").getBoundingClientRect().width, node.querySelector("#export").getBoundingClientRect().width]);
  assert.ok(Math.abs(widths[0] - widths[1]) < 1);
  assert.equal(await popup.locator("#copy").isEnabled(), true);
  assert.equal(await popup.locator("#extract").count(), 0);
  // Clear empty chat state: stale exports must be disabled after failed extraction.
  await fixture.unroute("https://chatgpt.com/backend-api/conversation/virtual");
  await fixture.locator("#space").evaluate((node) => node.replaceChildren());
  await fixture.evaluate(() => {
    document.querySelector("main").replaceWith(document.createElement("main"));
  });
  await popup.reload();
  await popup.getByText(/No messages found/).waitFor();
  assert.equal(await popup.locator("#export").isDisabled(), true);
  console.log(
    "PASS: unpacked extension, actual chrome.scripting extraction, four direct downloads, PDF rendering and popup verified. Active tab selection mocked; fixture-only host permission added to test copy.",
  );
} finally {
  await context.close();
}

