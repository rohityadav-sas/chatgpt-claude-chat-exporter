import { assertPdfDownload } from "./pdf-download-helper.mjs";
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile } from "node:fs/promises";
import path from "node:path";
import { cases, fixture } from "./in-page-fixtures.mjs";
import { installDirectFixture } from "./direct-fixtures.mjs";
const root = process.cwd();
await mkdir("artifacts", { recursive: true });
const rootLayout = process.argv.includes("--root");
const extension = rootLayout ? "artifacts/in-page-extension-root" : "dist";
if (rootLayout) {
  await cp("dist", `${extension}/dist`, { recursive: true });
  await cp("assets", `${extension}/assets`, { recursive: true });
  await cp("manifest.json", `${extension}/manifest.json`);
}
const context = await chromium.launchPersistentContext(
  await mkdtemp(path.join(root, "artifacts/in-page-profile-")),
  {
    channel: process.env.EXPORTER_BROWSER || "chromium",
    headless: true,
    acceptDownloads: true,
    args: [
      `--disable-extensions-except=${path.resolve(extension)}`,
      `--load-extension=${path.resolve(extension)}`,
    ],
  },
);
try {
  for (const [provider, url] of cases) {
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route(new URL(url).origin + "/**", (route) =>
      route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: fixture(provider),
      }),
    );
    await installDirectFixture(page, provider);
    if (provider === "claude")
      await page.addInitScript(() => {
        // Reproduce global type-to-compose shortcuts that cannot see a shadow input.
        document.addEventListener(
          "keydown",
          (event) => {
            if (event.key.length === 1 && event.target.tagName !== "INPUT") {
              document.querySelector("#shortcut-composer")?.focus();
            }
          },
          true,
        );
      });
    await page.goto(url);
    if (provider === "qwen")
      await page.evaluate(() => {
        document.title = "Qwen";
        const chatLink = document.createElement("a");
        chatLink.setAttribute("aria-label", "chat-item");
        chatLink.className = "chat-item-drag-link chat-item-drag-active";
        chatLink.innerHTML =
          '<div class="chat-item-drag-link-content"><div class="chat-item-drag-link-content-tip-text"><span class="chat-item-title-text">AI Capabilities Overview</span></div></div>';
        document.body.append(chatLink);
      });
    if (provider === "claude")
      await page.evaluate(() => {
        const composer = document.createElement("input");
        composer.id = "shortcut-composer";
        document.body.append(composer);
      });
    const signature = page.locator('[data-ai-chat-exporter="signature"]');
    const exportButton = signature.getByRole("button", {
      name: "Export conversation",
    });
    await exportButton.waitFor();
    await page.evaluate(() => {
      window.savedTurns = document.createDocumentFragment();
      const article = document.querySelector("article");
      while(article.firstChild) window.savedTurns.append(article.firstChild);
    });
    await signature.waitFor({state:"detached"});
    await page.evaluate(() => document.querySelector("article").append(window.savedTurns));
    await exportButton.waitFor();
    if (provider === "chatgpt") await page.evaluate(() => {
      document.querySelector('[data-ai-chat-exporter="panel"]').remove();
      window.providerHeaderClicks = 0;
      document.querySelector("#page-header").addEventListener("click", e => {
        if(e.target.closest('[data-ai-chat-exporter="signature"]')) {
          window.providerHeaderClicks++;
          document.querySelector('[data-ai-chat-exporter="panel"]')?.remove();
        }
      });
    });
    const buttonRect = await signature.boundingBox();
    const nativeRect = await page.locator("#native-action").boundingBox();
    assert.ok(buttonRect.x > 640 && buttonRect.y < 80, provider + " top right");
    assert.ok(
      buttonRect.x + buttonRect.width <= nativeRect.x + 1,
      provider + " before native actions",
    );
    if (provider === "claude")
      await page.evaluate(() => {
        const fetchOriginal = window.fetch;
        window.fetch = async (...args) => {
          if (String(args[0]).includes("chat_conversations"))
            await new Promise((resolve) => setTimeout(resolve, 700));
          return fetchOriginal(...args);
        };
      });
    await exportButton.click();
    if(provider === "chatgpt") assert.equal(await page.evaluate(()=>window.providerHeaderClicks), 0);
    const panel = page.locator('[data-ai-chat-exporter="panel"]');
    if (provider === "claude") {
      assert.ok(
        (await panel.locator(".title").inputValue()).length > 0,
        "Title must appear before the delayed API response",
      );
      assert.equal(await panel.locator(".save").isDisabled(), true);
      assert.equal(
        await panel.locator(".selection-badge").textContent(),
        "Loading",
      );
      assert.equal(await panel.locator(".status").isVisible(), false);
      await panel.locator(".title").fill("My edited export title");
      await panel.locator(".title").press("End");
      await page.keyboard.type(" typed here");
      assert.equal(
        await panel.locator(".title").inputValue(),
        "My edited export title typed here",
      );
      assert.equal(await page.locator("#shortcut-composer").inputValue(), "");
      await panel.locator(".title").fill("My edited export title");
    }
    await panel
      .getByText("2 messages · 1 from you")
      .waitFor({ state: "attached" });
    if (provider === "qwen")
      assert.equal(
        await panel.locator(".title").inputValue(),
        "AI Capabilities Overview",
      );
    assert.equal(
      await panel.locator(".message-row").count(),
      0,
      "Selection rows are deferred until the list is opened",
    );
    const navigation = panel.locator(".selection-toggle");
    await panel.locator(".title").hover();
    const restingBackground = await navigation.evaluate(
      (n) => getComputedStyle(n).backgroundColor,
    );
    await navigation.hover();
    assert.notEqual(
      await navigation.evaluate((n) => getComputedStyle(n).backgroundColor),
      restingBackground,
    );
    if (provider === "claude")
      assert.equal(
        await panel.locator(".title").inputValue(),
        "My edited export title",
      );
    for (const format of ["md", "json", "txt"]) {
      await panel.locator(`input[value="${format}"]`).check();
      const downloadPromise = page.waitForEvent("download");
      await panel.locator(".save").click();
      const download = await downloadPromise;
      const file = path.join(
        root,
        "artifacts",
        `${provider}-embedded.${format}`,
      );
      await download.saveAs(file);
      const content = await readFile(file, "utf8");
      if (provider === "claude")
        assert.ok(content.includes("PASTED_TEXT_INCLUDED"));
      assert.ok(
        content.includes("नेपाली") && content.includes("const n = 42;"),
        provider + " export content",
      );
      if (format === "json") {
        const chat = JSON.parse(content);
        assert.equal(
          chat.capture.complete,
          true,
          provider + " direct extraction",
        );
        assert.equal(chat.capture.scrolled, false);
        assert.ok(
          !content.includes("PRIVATE THINKING") &&
            !content.includes("WRONG BRANCH"),
        );
      }
    }
    await page.evaluate(() => {
      window.pdfProgressValues = [];
      const node = document
        .querySelector('[data-ai-chat-exporter="panel"]')
        .shadowRoot.querySelector(".export-progress");
      new MutationObserver(() =>
        window.pdfProgressValues.push(
          Number(node.getAttribute("aria-valuenow")),
        ),
      ).observe(node, { attributes: true, attributeFilter: ["aria-valuenow"] });
    });
    await panel.locator('input[value="pdf"]').check();
    await assertPdfDownload(
      context,
      () => panel.locator(".save").click(),
      "artifacts/" + provider + "-full.pdf",
    );
    assert.ok(
      await page.evaluate(() =>
        window.pdfProgressValues.some((value) => value > 0 && value < 100),
      ),
      "PDF progress must report intermediate percentages",
    );
    await page.bringToFront();
    // Selection changes actual exported content, not only the checkboxes.
    await panel.getByRole("button", { name: /Select messages/ }).click();
    const filterWidths = await panel
      .locator(".selection-tools button")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getBoundingClientRect().width),
      );
    assert.ok(Math.max(...filterWidths) - Math.min(...filterWidths) < 1);
    assert.equal(await panel.locator(".role-label svg").count(), 2);
    await panel
      .getByRole("checkbox", { name: "Select all messages", exact: true })
      .uncheck();
    assert.equal(await panel.locator(".save").isDisabled(), true);
    await panel.getByRole("button", { name: "Invert", exact: true }).click();
    assert.equal(await panel.locator(".message-row input:checked").count(), 2);
    await panel.getByRole("button", { name: "User", exact: true }).click();
    assert.equal(await panel.locator(".message-row input:checked").count(), 1);
    for (const format of ["md", "json", "txt"]) {
      await panel.locator(".format-trigger").click();
      await panel
        .locator("section")
        .screenshot({ path: "artifacts/custom-menu.png" });
      await panel
        .getByRole("option", {
          name: { md: "Markdown", json: "JSON", txt: "Text" }[format],
          exact: true,
        })
        .click();
      assert.deepEqual(errors, []);
      assert.equal(
        await panel.locator(".format-trigger").evaluate(node => Array.from(node.childNodes).filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent).join("")),
        { md: "Markdown", json: "JSON", txt: "Text" }[format],
      );
      const pending = page.waitForEvent("download");
      await panel.locator(".save").click();
      const download = await pending;
      const file = path.join(
        root,
        "artifacts",
        `${provider}-human-only.${format}`,
      );
      await download.saveAs(file);
      const content = await readFile(file, "utf8");
      assert.ok(
        content.includes("नेपाली") && !content.includes("const n = 42;"),
      );
      if (format === "json") {
        const selected = JSON.parse(content);
        assert.deepEqual(selected.selection, { selected: 1, total: 2 });
        assert.equal(selected.messages[0].role, "user");
      }
    }
    await panel
      .getByRole("button", {
        name: {
          chatgpt: "ChatGPT",
          claude: "Claude",
          grok: "Grok",
          deepseek: "DeepSeek",
          gemini: "Gemini",
          qwen: "Qwen",
          perplexity: "Perplexity",
          mistral: "Mistral",
        }[provider],
        exact: true,
      })
      .click();
    await panel.locator(".format-trigger").click();
    await page.keyboard.press("Escape");
    assert.equal(await panel.locator(".format-menu").isVisible(), false);
    assert.equal(await panel.locator(".save").isVisible(), true);
    await panel.locator(".format-trigger").focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    assert.equal(await panel.locator(".format-trigger").evaluate(node => Array.from(node.childNodes).filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent).join("")), "PDF");
    assert.equal(await panel.locator(".format-menu").isVisible(), false);
    await assertPdfDownload(
      context,
      () => panel.locator(".save").click(),
      "artifacts/" + provider + "-assistant.pdf",
    );
    await page.bringToFront();
    await panel
      .getByRole("checkbox", { name: "Select all messages", exact: true })
      .check();
    await panel.locator(".message-row input").first().uncheck();
    assert.equal(await panel.locator(".selection-badge").textContent(), "1/2");
    await panel.locator(".expand-messages").check();
    assert.ok(
      await panel
        .locator(".message-list")
        .evaluate((e) => e.classList.contains("expanded")),
    );
    await panel.getByRole("button", { name: "Close export options" }).click();
    // A framework can replace the header during navigation. Reattach once.
    await page.evaluate(() => {
      const header = document.querySelector("header,.top");
      const clone = header.cloneNode(true);
      clone
        .querySelectorAll("[data-ai-chat-exporter]")
        .forEach((node) => node.remove());
      header.replaceWith(clone);
      history.pushState({}, "", location.pathname + "?changed=1");
    });
    await exportButton.waitFor();
    assert.equal(await signature.count(), 1);
    await exportButton.click();
    await panel
      .getByText("2 messages · 1 from you")
      .waitFor({ state: "attached" });
    assert.equal(await panel.locator(".selection-badge").textContent(), "2/2");
    assert.equal(
      await panel.locator(".selection-toggle").getAttribute("aria-expanded"),
      "false",
    );
    // Direct extraction and PDF must also survive history.pushState navigation.
    await panel.locator('input[value="json"]').check();
    const spaDownloadPromise = page.waitForEvent("download");
    await panel.locator(".save").click();
    const spaDownload = await spaDownloadPromise;
    const spaFile = path.join(root, "artifacts", `${provider}-spa.json`);
    await spaDownload.saveAs(spaFile);
    assert.equal(
      JSON.parse(await readFile(spaFile, "utf8")).capture.complete,
      true,
    );
    await panel.locator('input[value="pdf"]').check();
    await assertPdfDownload(context, () => panel.locator(".save").click());
    await page.bringToFront();
    if (provider === "claude") {
      await panel.locator('input[value="txt"]').check();
      await page.screenshot({ path: "artifacts/embedded-export-light.png" });
      await panel.getByRole("button", { name: /Select messages/ }).click();
      await panel
        .locator("section")
        .screenshot({ path: "artifacts/message-selection-light.png" });
      await page.evaluate(() => document.documentElement.classList.add("dark"));
      await page
        .locator('[data-ai-chat-exporter="signature"][data-theme="dark"]')
        .waitFor();
      await panel.locator("section").screenshot({
        path: "artifacts/embedded-export-dark.png",
        animations: "disabled",
      });
      // A long picker must scroll internally and keep Export within the viewport.
      await page.route(
        /\/api\/organizations\/.*\/chat_conversations\//,
        (route) =>
          route.fulfill({
            json: {
              name: "Fixing pnpm global bin PATH error",
              current_leaf_message_uuid: "long-57",
              chat_messages: Array.from({ length: 58 }, (_, index) => ({
                uuid: `long-${index}`,
                parent_message_uuid: index
                  ? `long-${index - 1}`
                  : "00000000-0000-4000-8000-000000000000",
                sender: index % 2 ? "assistant" : "human",
                content: [
                  {
                    type: "text",
                    text:
                      index % 2
                        ? `Here is the next step for your project. Message ${index + 1}.\n\nRun the command, then check the output.`
                        : `Can you explain step ${index + 1} and show the command?`,
                  },
                ],
              })),
            },
          }),
      );
      await panel.locator(".close").click();
      await signature
        .getByRole("button", { name: "Export conversation" })
        .click();
      await panel
        .getByText("58 messages · 29 from you")
        .waitFor({ state: "attached" });
      await panel.getByRole("button", { name: /Select messages/ }).click();
      await panel.getByRole("button", { name: "User", exact: true }).click();
      assert.equal(
        await panel.locator(".message-row input:checked").count(),
        29,
      );
      const scrollable = await panel
        .locator(".message-list")
        .evaluate((element) => element.scrollHeight > element.clientHeight);
      assert.equal(scrollable, true);
      const saveBounds = await panel.locator(".save").boundingBox();
      assert.ok(
        saveBounds.y + saveBounds.height < page.viewportSize().height,
        "Export stays visible in the long picker",
      );
      await page.evaluate(() =>
        document.documentElement.classList.remove("dark"),
      );
      await page
        .locator('[data-ai-chat-exporter="signature"][data-theme="light"]')
        .waitFor();
      await panel.locator("section").screenshot({
        path: "artifacts/message-selection-long-light.png",
        animations: "disabled",
      });
    }
    await page.keyboard.press("Escape");
    await panel.waitFor({ state: "hidden" });
    assert.deepEqual(errors, []);
    console.log(
      `PASS ${provider}: automatic header button, correct placement, MD/JSON/text downloads, PDF background bridge, SPA reattachment, Escape dismissal`,
    );
    await page.close();
  }
} finally {
  await context.close();
}
