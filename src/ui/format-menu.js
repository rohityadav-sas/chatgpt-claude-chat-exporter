import { motion } from "./motion.js";
import { icon } from "./icons.js";
import css from "./format-menu.css";
export function createFormatMenu(document, onChange) {
  const host = document.createElement("div");
  host.className = "compact-format format-select";
  const style = document.createElement("style");
  style.textContent = css;
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "format-trigger";
  trigger.setAttribute("aria-label", "Export format");
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  const menu = document.createElement("div");
  menu.className = "format-menu";
  menu.setAttribute("role", "listbox");
  menu.setAttribute("aria-label", "Export format");
  menu.hidden = true;
  const labels = { md: "Markdown", pdf: "PDF", json: "JSON", txt: "Text" };
  let value = "md";
  const choices = Object.entries(labels).map(([key, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "format-option";
    button.setAttribute("role", "option");
    button.dataset.value = key;
    button.append(icon(document, key), label);
    button.addEventListener("click", () => {
      setValue(key);
      close();
      onChange(key);
      trigger.focus();
    });
    menu.append(button);
    return button;
  });
  function setValue(key) {
    value = key;
    trigger.replaceChildren(
      icon(document, key),
      document.createTextNode(labels[key]),
      icon(document, "chevron"),
    );
    choices.forEach((b) =>
      b.setAttribute("aria-selected", String(b.dataset.value === value)),
    );
  }
  function close() {
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  }
  function open() {
    menu.hidden = false;
    motion(menu, [
      { opacity: 0, transform: "translateY(4px)" },
      { opacity: 1, transform: "translateY(0)" },
    ]);
    trigger.setAttribute("aria-expanded", "true");
    choices.find((b) => b.dataset.value === value).focus();
  }
  trigger.addEventListener("click", () => (menu.hidden ? open() : close()));
  trigger.addEventListener("keydown", (e) => {
    if (["ArrowDown", "ArrowUp"].includes(e.key)) {
      e.preventDefault();
      open();
    }
  });
  menu.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
      trigger.focus();
    }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
      e.preventDefault();
      const active = choices.indexOf(host.getRootNode().activeElement);
      choices[
        e.key === "Home"
          ? 0
          : e.key === "End"
            ? choices.length - 1
            : (Math.max(active, 0) +
                (e.key === "ArrowDown" ? 1 : -1) +
                choices.length) %
              choices.length
      ].focus();
    }
  });
  document.addEventListener("pointerdown", (e) => {
    if (!e.composedPath().includes(host) && !host.contains(e.target)) close();
  });
  host.addEventListener("focusout", (event) => {
    if (!host.contains(event.relatedTarget)) close();
  });
  host.append(style, trigger, menu);
  setValue(value);
  return {
    host,
    setValue,
    close,
    get open() {
      return !menu.hidden;
    },
  };
}
