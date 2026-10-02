import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
export async function assertPdfDownload(context, click, target) {
  const worker = context.serviceWorkers()[0];
  const previous = await worker.evaluate(async () =>
    (await chrome.downloads.search({})).map((d) => d.id),
  );
  const pages = context.pages().length;
  const started = Date.now();
  await click();
  const download = await worker.evaluate(async (previous) => {
    const until = Date.now() + 60000;
    while (Date.now() < until) {
      const item = (await chrome.downloads.search({})).find(
        (d) => !previous.includes(d.id) && d.mime === "application/pdf",
      );
      if (item?.state === "complete") return item;
      if (item?.state === "interrupted") throw new Error(item.error);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error("PDF download did not complete");
  }, previous);
  if (target?.includes("long-conversation"))
    console.log(
      `BENCHMARK long PDF: ${Date.now() - started} ms including download`,
    );
  const bytes = await readFile(download.filename);
  assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
  assert.ok(bytes.length > 1000);
  if (target) await writeFile(target, bytes);
  assert.equal(context.pages().length, pages, "PDF must not open a new tab");
}
