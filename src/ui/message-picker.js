import { motion, resize } from "./motion.js";
import motionStyles from "./motion.css";
import { providerIcon } from "./provider-icon.js";
import { icon } from "./icons.js";
import { MessageSelection } from "../core/selection.js";
import pickerStyles from "./message-picker.css";
let pickerId = 0;
function node(document, tag, properties = {}, children = []) {
  const element = document.createElement(tag);
  Object.assign(element, properties);
  element.append(...children);
  return element;
}
export function createMessagePicker(
  document,
  onChange = () => {},
  onOpenChange = () => {},
) {
  const host = node(document, "div", { className: "message-picker" });
  const badge = node(document, "span", { className: "selection-badge" });
  const toggleText = node(document, "span", { textContent: "Select messages" });
  const selectionIcon = icon(document, "select");
  selectionIcon.classList.add("picker-selection-icon");
  const back = icon(document, "back");
  back.classList.add("picker-back");
  back.setAttribute("hidden", "");
  const toggleLabel = node(
    document,
    "span",
    { className: "selection-toggle-label" },
    [back, selectionIcon, toggleText],
  );
  const toggle = node(
    document,
    "button",
    { type: "button", className: "selection-toggle", disabled: true },
    [toggleLabel, badge],
  );
  const detail = node(document, "div", {
    className: "selection-detail",
    hidden: true,
    id: `message-picker-${++pickerId}`,
  });
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", detail.id);
  const tools = node(document, "div", { className: "selection-tools" });
  const list = node(document, "div", { className: "message-list" });
  list.setAttribute("role", "group");
  list.setAttribute("aria-label", "Messages to export");
  const count = node(document, "span", { className: "selection-count" });
  count.setAttribute("aria-live", "polite");
  const expand = node(document, "input", {
    type: "checkbox",
    className: "expand-messages",
  });
  const footer = node(document, "div", { className: "selection-footer" }, [
    count,
    node(document, "label", {}, [expand, "Expand"]),
  ]);
  badge.setAttribute("aria-live", "polite");
  count.hidden = true;
  detail.append(tools, list, footer);
  host.append(
    node(document, "style", { textContent: pickerStyles + motionStyles }),
    toggle,
    detail,
  );
  let aiName = "AI";
  let buildRows;
  const master = node(document, "input", { type: "checkbox", disabled: true });
  master.setAttribute("aria-label", "Select all messages");
  master.addEventListener("change", () => {
    selection?.select(master.checked ? "all" : "none");
    update();
  });
  tools.append(
    node(document, "label", { className: "select-all" }, [master, "All"]),
  );
  let aiButton;
  let selection,
    inputs = [];
  function update() {
    if (!selection) return;
    inputs.forEach((input, index) => {
      input.checked = selection.indices.has(index);
    });
    master.checked = selection.count === selection.messages.length;
    master.indeterminate =
      selection.count > 0 && selection.count < selection.messages.length;
    const nextCount = `${selection.count}/${selection.messages.length}`;
    if (badge.textContent !== nextCount)
      motion(badge, [{ opacity: 0.3 }, { opacity: 1 }]);
    badge.textContent = nextCount;
    count.textContent = `${selection.count} of ${selection.messages.length} selected`;
    onChange(selection.count);
  }
  for (const [label, mode] of [
    ["User", "user"],
    ["AI", "assistant"],
    ["Invert", "invert"],
  ]) {
    const button = node(document, "button", {
      type: "button",
      textContent: label,
    });
    button.addEventListener("click", () => {
      selection?.select(mode);
      update();
    });
    button.prepend(
      icon(
        document,
        mode === "user" ? "user" : mode === "invert" ? "invert" : "export",
      ),
    );
    if (mode === "assistant") aiButton = button;
    tools.append(button);
  }
  const layout = () =>
    host.getRootNode().querySelector(".panel") || document.body;
  toggle.addEventListener("click", () =>
    resize(layout(), () => {
      if (detail.hidden && buildRows) {
        buildRows();
        buildRows = undefined;
      }
      detail.hidden = !detail.hidden;
      toggle.setAttribute("aria-expanded", String(!detail.hidden));
      toggleText.textContent = detail.hidden
        ? "Select messages"
        : "Export options";
      back.toggleAttribute("hidden", detail.hidden);
      selectionIcon.toggleAttribute("hidden", !detail.hidden);
      host.classList.toggle("picker-open", !detail.hidden);
      onOpenChange(!detail.hidden);
      // Trial: incoming selection view slides from the right; Back reveals
      // export options from the left. Animate content, keeping the shell still.
      const view = layout();
      const incoming = detail.hidden ? "-30%" : "100%";
      for (const child of view.children) {
        if (child.tagName === "STYLE" || child.hidden || child.getBoundingClientRect().height === 0) continue;
        motion(child, [
          { opacity: .35, transform: `translateX(${incoming})` },
          { opacity: 1, transform: "translateX(0)" },
        ], 220);
      }
    }),
  );
  expand.addEventListener("change", () =>
    resize(layout(), () => list.classList.toggle("expanded", expand.checked)),
  );
  function reset() {
    selection = undefined;
    buildRows = undefined;
    inputs = [];
    list.replaceChildren();
    badge.textContent = "";
    badge.classList.remove("loading");
    count.textContent = "";
    toggle.disabled = true;
    detail.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    toggleText.textContent = "Select messages";
    back.setAttribute("hidden", "");
    selectionIcon.removeAttribute("hidden");
    host.classList.remove("picker-open");
    master.disabled = true;
    master.checked = false;
    master.indeterminate = false;
    onOpenChange(false);
    expand.checked = false;
    list.classList.remove("expanded");
  }
  function setConversation(conversation) {
    reset();
    aiName =
      {
        chatgpt: "ChatGPT",
        claude: "Claude",
        grok: "Grok",
        deepseek: "DeepSeek",
        gemini: "Gemini",
        qwen: "Qwen",
        perplexity: "Perplexity",
        mistral: "Mistral",
      }[conversation.provider] || "AI";
    aiButton.replaceChildren(
      providerIcon(document, conversation.provider),
      aiName,
    );
    master.disabled = false;
    selection = new MessageSelection(conversation.messages);
    toggle.disabled = false;
    update();
    buildRows = () => {
      const rows = document.createDocumentFragment();
      conversation.messages.forEach((message, index) => {
        const role = message.role === "user" ? "User" : aiName;
        const preview = message.text || message.markdown;
        const input = node(document, "input", {
          type: "checkbox",
          checked: true,
        });
        input.setAttribute(
          "aria-label",
          `Message ${index + 1}, ${role}: ${preview.replace(/\s+/g, " ").slice(0, 100)}`,
        );
        input.addEventListener("change", () => {
          selection.toggle(index, input.checked);
          update();
        });
        inputs.push(input);
        rows.append(
          node(document, "label", { className: "message-row" }, [
            input,
            node(document, "span", {
              className: "message-number",
              textContent: String(index + 1),
            }),
            node(document, "span", { className: "message-copy" }, [
              node(document, "span", { className: "role-label", title: role }, [
                message.role === "user"
                  ? icon(document, "user")
                  : providerIcon(document, conversation.provider),
              ]),
              node(document, "span", {
                className: "message-preview",
                textContent: preview,
              }),
            ]),
          ]),
        );
      });
      list.append(rows);
      update();
    };
  }
  return {
    host,
    reset,
    loading() {
      reset();
      badge.textContent = "Loading";
      badge.classList.add("loading");
    },
    unavailable() {
      badge.textContent = "0/0";
      badge.classList.remove("loading");
    },
    setConversation,
    pendingCount(total) {
      badge.textContent = `${total}/${total}`;
      badge.classList.remove("loading");
    },
    apply: (conversation) => selection.apply(conversation),
    get count() {
      return selection?.count || 0;
    },
  };
}
