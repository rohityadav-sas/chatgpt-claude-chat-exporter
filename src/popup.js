import { completed } from "./ui/motion.js";
import { createFormatMenu } from "./ui/format-menu.js";
import { conversationTitle } from "./core/conversation-title.js";
import { createExportProgress, downloadPdf } from "./ui/export-progress.js";
import { findProvider, providers } from "./providers/index.js";
import { downloadExport } from "./core/download.js";
import { createMessagePicker } from "./ui/message-picker.js";
import { icon } from "./ui/icons.js";
import { captureStatus } from "./core/capture-status.js";
const $ = (id) => document.getElementById(id);
// Resource paths are relative to the popup's directory, which may be dist/.
const scriptDirectory = new URL(".", location.href).pathname.slice(1);
const progress = createExportProgress(document);
$("status").after(progress.host);
let conversation;
let exporting = false;
let tab;
const labels = { pdf: "PDF", md: "Markdown", json: "JSON", txt: "Text" };
const picker = createMessagePicker(
  document,
  (count) => {
    $("export").disabled = exporting || !conversation || count === 0;
  },
  (open) => {
    document.body.classList.toggle("selecting", open);
    document.querySelector("h1").textContent = open
      ? "Select messages"
      : "Title";
  },
);
const formatMenu = createFormatMenu(document, (value) => {
  const input = document.querySelector(
    `input[name="format"][value="${value}"]`,
  );
  input.checked = true;
  input.dispatchEvent(new Event("change"));
});
formatMenu.host.id = "compact-format";
$("compact-format").replaceWith(formatMenu.host);
$("message-selection").append(picker.host);
$("export").prepend(icon(document));
$("close").append(icon(document, "close"));
$("close").addEventListener("click", () => window.close());
document
  .querySelectorAll(".formats label")
  .forEach((label) =>
    label
      .querySelector("span")
      .prepend(icon(document, label.querySelector("input").value)),
  );
const selectedFormat = () =>
  document.querySelector('input[name="format"]:checked').value;
function status(text, error = false) {
  $("status").textContent = text;
  $("status").hidden = !text;
  $("status").classList.toggle("error", error);
}

async function init() {
  try {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const provider = findProvider(tab?.url);
    $("provider").textContent = provider
      ? `${provider.name} · supported`
      : "Open a supported conversation";
    $("extract").disabled = !provider;
    if (!provider)
      status(
        `Supported: ${providers.map((item) => item.name).join(", ")}.`,
        true,
      );
    else await extract();
  } catch (error) {
    status(error.message, true);
  }
}
async function extract() {
  $("extract").disabled = true;
  $("export").disabled = true;
  conversation = undefined;
  picker.loading();
  $("summary").hidden = true;
  const previewTitle = conversationTitle(
    tab?.title,
    findProvider(tab?.url)?.name,
  );
  $("title").value = previewTitle;
  $("summary").hidden = false;
  status("");
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: [`${scriptDirectory}content.js`],
    });
    if (result?.result?.error) throw new Error(result.result.error);
    if (!result?.result?.conversation)
      throw new Error("Extraction failed. Reload the chat and try again.");
    conversation = result.result.conversation;
    if ($("title").value === previewTitle)
      $("title").value = conversation.title;
    $("count").textContent =
      `${conversation.messages.length} messages · ${conversation.messages.filter((message) => message.role === "user").length} from you`;
    $("summary").hidden = false;
    picker.setConversation(conversation);
    const partial = conversation.capture && !conversation.capture.complete;
    status(captureStatus(conversation.capture), partial);
  } catch (error) {
    picker.unavailable();
    status(error.message, true);
  } finally {
    $("extract").disabled = false;
  }
}
$("extract").addEventListener("click", extract);
document.querySelectorAll('input[name="format"]').forEach((input) =>
  input.addEventListener("change", () => {
    const format = selectedFormat();
    formatMenu.setValue(format);
    status("");
  }),
);
$("export").addEventListener("click", async () => {
  if (exporting || !conversation || !picker.count) return;
  const chat = picker.apply({
    ...conversation,
    title: $("title").value.trim() || conversation.title,
  });
  exporting = true;
  $("export").disabled = true;
  progress.start();
  status("");
  try {
    const format = selectedFormat();
    if (format === "pdf") {
      await downloadPdf(chat, progress.update);
    } else {
      downloadExport(chat, format);
      progress.update(85);
    }
    progress.finish();
    completed($("export"));
  } catch (error) {
    progress.hide();
    status(error.message, true);
  } finally {
    exporting = false;
    $("export").disabled = !conversation || !picker.count;
  }
});
init();
