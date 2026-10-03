import { motion, completed } from "./motion.js";
import { createFormatMenu } from "./format-menu.js";
import { pageConversationTitle } from "../core/conversation-title.js";
import { createExportProgress, downloadPdf } from "./export-progress.js";
import styles from "./in-page.css";
import { captureConversation } from "../core/capture.js";
import { copyExport } from "../core/copy.js";
import { downloadExport } from "../core/download.js";
import { createMessagePicker } from "./message-picker.js";
import { icon } from "./icons.js";
import { captureStatus } from "../core/capture-status.js";

const labels = {
  md: ["MD", "Markdown"],
  pdf: ["PDF", "PDF"],
  json: ["JSON", "JSON"],
  txt: ["Text", "Text"],
};

function element(document, tag, properties = {}, children = []) {
  const node = document.createElement(tag);
  Object.assign(node, properties);
  node.append(...children);
  return node;
}

export function createSignature(document) {
  const host = element(document, "span");
  host.dataset.aiChatExporter = "signature";
  host.style.cssText =
    "display:inline-flex;align-self:center;align-items:center;flex:0 0 auto;margin-inline-end:8px;pointer-events:auto;line-height:normal;";
  const shadow = host.attachShadow({ mode: "open" });
  const button = element(
    document,
    "button",
    {
      className: "signature",
      type: "button",
      title: "Export this conversation",
    },
    [icon(document), "Export"],
  );
  button.setAttribute("aria-label", "Export conversation");
  button.setAttribute("aria-haspopup", "dialog");
  button.setAttribute("aria-expanded", "false");
  // Keep provider header handlers from treating Export as their own action.
  for (const type of ["pointerdown", "mousedown", "click"]) {
    shadow.addEventListener(type, (event) => event.stopPropagation());
  }
  shadow.append(element(document, "style", { textContent: styles }), button);
  return { host, button };
}

export function createExportPanel(document, signature, provider) {
  const host = element(document, "div");
  host.dataset.aiChatExporter = "panel";
  host.dataset.exporterVersion = __EXPORTER_BUILD_VERSION__;
  host.style.cssText =
    "display:none;position:fixed;z-index:2147483646;pointer-events:auto;";
  const shadow = host.attachShadow({ mode: "open" });
  const title = element(document, "input", {
    className: "title",
    type: "text",
    maxLength: 200,
    id: "conversation-title",
    disabled: true,
  });
  const titleLabel = element(document, "label", {
    className: "visually-hidden",
    htmlFor: title.id,
    textContent: "Title",
  });
  const progress = createExportProgress(document);
  const count = element(document, "p", {
    className: "count",
    textContent: "Reading conversation…",
  });
  const status = element(document, "p", {
    className: "status",
    textContent: "",
  });
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const heading = element(document, "h2", {
    id: "export-heading",
    textContent: "Title",
  });
  const close = element(
    document,
    "button",
    { className: "close", type: "button", title: "Close export options" },
    [icon(document, "close")],
  );
  close.setAttribute("aria-label", "Close export options");
  const save = element(
    document,
    "button",
    {
      className: "save",
      type: "button",
      disabled: true,
    },
    [icon(document), "Download"],
  );
  save.setAttribute("aria-label", "Download selected messages");
  const copy = element(
    document,
    "button",
    { className: "copy-action", type: "button", disabled: true },
    [icon(document, "copy"), "Copy"],
  );
  const providerPill = element(document, "span", {
    className: "provider-pill",
    textContent: provider.name + " � supported",
  });
  function syncActions() {
    save.disabled =
      capturing || exporting || !conversation || picker.count === 0;
    copy.disabled = save.disabled;
    copy.title =
      format === "pdf"
        ? "Copy as Markdown (PDF is download only)"
        : "Copy selected messages";
  }
  const formats = element(document, "div", { className: "formats" });
  const picker = createMessagePicker(
    document,
    (count) => {
      syncActions();
    },
    (open) => {
      panel.classList.toggle("selecting", open);
      heading.textContent = open ? "Select messages" : "Title";
    },
  );
  let format = "md";
  const formatMenu = createFormatMenu(document, (value) => {
    format = value;
    syncActions();
    formats.querySelector(`input[value="${value}"]`).checked = true;
  });
  const compactFormat = formatMenu.host;
  for (const [value, [name, description]] of Object.entries(labels)) {
    const input = element(document, "input", {
      type: "radio",
      name: "export-format",
      value,
      checked: value === format,
    });
    input.setAttribute("aria-label", description);
    const tile = element(document, "span", {}, [icon(document, value), name]);
    formats.append(
      element(document, "label", { className: "format" }, [input, tile]),
    );
    input.addEventListener("change", () => {
      format = value;
      syncActions();
      formatMenu.setValue(value);
    });
  }
  const panel = element(
    document,
    "section",
    { className: "panel", tabIndex: -1 },
    [
      element(document, "div", { className: "heading" }, [
        heading,
        providerPill,
        close,
      ]),
      titleLabel,
      title,
      count,
      picker.host,
      element(document, "fieldset", {}, [
        element(document, "legend", {
          className: "visually-hidden",
          textContent: "Export format",
        }),
        formats,
      ]),
      element(document, "div", { className: "export-actions" }, [
        compactFormat,
        copy,
        save,
      ]),
      status,
      progress.host,
    ],
  );
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-labelledby", heading.id);
  shadow.append(element(document, "style", { textContent: styles }), panel);
  document.body.append(host);
  let conversation;
  let capturing = false;
  let exporting = false;
  let generation = 0;
  function setStatus(text, error = false) {
    status.textContent = text;
    status.hidden = !text;
    status.classList.toggle("error", error);
  }
  function position() {
    const rect = signature.host.getBoundingClientRect();
    const width = Math.min(400, document.defaultView.innerWidth - 24);
    host.style.left = `${Math.max(12, Math.min(rect.right - width, document.defaultView.innerWidth - width - 12))}px`;
    host.style.top = `${Math.max(8, rect.bottom + 9)}px`;
    panel.style.maxHeight = `${Math.max(160, document.defaultView.innerHeight - Math.max(8, rect.bottom + 9) - 12)}px`;
  }
  let closing;
  function hide({ focus = true } = {}) {
    closing?.cancel();
    closing =
      host.style.display === "none"
        ? null
        : motion(
            panel,
            [
              { opacity: 1, transform: "translateY(0)" },
              { opacity: 0, transform: "translateY(-6px)" },
            ],
            120,
          );
    if (closing) {
      const current = closing;
      current.finished
        .then(() => {
          if (closing === current) {
            host.style.display = "none";
            closing = null;
          }
        })
        .catch(() => {});
    } else host.style.display = "none";
    signature.button.setAttribute("aria-expanded", "false");
    if (focus) signature.button.focus();
  }
  async function extract() {
    if (capturing) return;
    capturing = true;
    conversation = undefined;
    picker.loading();
    const request = ++generation;
    save.disabled = copy.disabled = true;
    const previewTitle = pageConversationTitle(
      document,
      document.defaultView.location.href,
      provider.name,
    );
    title.value = previewTitle;
    title.disabled = false;
    count.textContent = "Reading conversation…";
    setStatus("");
    try {
      const chat = await captureConversation(
        document,
        document.defaultView.location.href,
        (total) => {
          if (request === generation) picker.pendingCount(total);
        },
      );
      if (request !== generation) return;
      conversation = chat;
      if (title.value === previewTitle) title.value = chat.title;
      count.textContent = `${chat.messages.length} messages · ${chat.messages.filter((message) => message.role === "user").length} from you`;
      title.disabled = false;
      picker.setConversation(chat);
      const partial = chat.capture && !chat.capture.complete;
      setStatus(captureStatus(chat.capture), partial);
    } catch (error) {
      if (request === generation) {
        picker.unavailable();
        count.textContent = "Conversation unavailable";
        setStatus(error.message, true);
      }
    } finally {
      if (request === generation) {
        capturing = false;
        syncActions();
      }
    }
  }
  function open() {
    // SPA hydration/header changes may remove the panel from the document.
    if (!host.isConnected) document.body.append(host);
    closing?.cancel();
    closing = null;
    host.style.display = "block";
    position();
    motion(
      panel,
      [
        { opacity: 0, transform: "translateY(-6px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      180,
    );
    signature.button.setAttribute("aria-expanded", "true");
    close.focus();
    if (!capturing) extract();
  }
  function reset() {
    ++generation;
    conversation = undefined;
    picker.reset();
    capturing = false;
    hide({ focus: false });
  }
  signature.button.addEventListener("click", () =>
    host.style.display === "none" || closing ? open() : hide(),
  );
  close.addEventListener("click", () => hide());

  async function performAction(copying = false) {
    if (exporting || !conversation || !picker.count) return;
    if (conversation.url !== document.defaultView.location.href) {
      conversation = undefined;
      save.disabled = true;
      setStatus(
        "The conversation changed. Reopen Export to read it again.",
        true,
      );
      return;
    }
    const chat = picker.apply({
      ...conversation,
      title: title.value.trim() || conversation.title,
    });
    exporting = true;
    syncActions();
    if (!copying) progress.start();
    setStatus("");
    try {
      if (copying) {
        await copyExport(chat, format);
        completed(copy);
        setStatus("Copied" + (format === "pdf" ? " as Markdown" : "") + ".");
      } else if (format === "pdf") {
        await downloadPdf(chat, progress.update);
      } else {
        downloadExport(chat, format, document);
        progress.update(85);
      }
      if (!copying) {
        progress.finish();
        completed(save);
      }
    } catch (error) {
      progress.hide();
      setStatus(error.message, true);
    } finally {
      exporting = false;
      syncActions();
    }
  }
  save.addEventListener("click", () => performAction());
  copy.addEventListener("click", () => performAction(true));
  document.addEventListener(
    "pointerdown",
    (event) => {
      if (
        host.style.display !== "none" &&
        !event.composedPath().includes(host) &&
        !event.composedPath().includes(signature.host)
      )
        hide({ focus: false });
    },
    true,
  );
  // Page shortcuts see the shadow host rather than this input and may focus
  // their composer. Intercept title keys before document capture handlers,
  // preserving the browser's native editing, clipboard and caret behavior.
  for (const type of ["keydown", "keypress", "keyup"]) {
    document.defaultView.addEventListener(
      type,
      (event) => {
        if (
          host.style.display === "none" ||
          !event.composedPath().includes(title)
        )
          return;
        if (type === "keydown" && event.key === "Escape") {
          event.preventDefault();
          hide();
        }
        event.stopImmediatePropagation();
      },
      true,
    );
  }
  for (const type of ["keydown", "keypress", "keyup"]) {
    shadow.addEventListener(type, (event) => event.stopPropagation());
  }
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape" && formatMenu.open) {
        formatMenu.close();
        return;
      }
      if (event.key === "Escape" && host.style.display !== "none") {
        event.preventDefault();
        event.stopPropagation();
        hide();
      }
    },
    true,
  );
  shadow.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      const focusable = Array.from(
        shadow.querySelectorAll(
          "button:enabled, input:enabled, select:enabled",
        ),
      ).filter(
        (node) =>
          !node.closest("[hidden]") && (node.type !== "radio" || node.checked),
      );
      const first = focusable[0],
        last = focusable.at(-1);
      if (event.shiftKey && shadow.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && shadow.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  });
  document.defaultView.addEventListener("resize", position);
  return { host, open, hide, reset, position };
}
