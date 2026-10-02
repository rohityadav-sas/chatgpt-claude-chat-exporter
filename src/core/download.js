import { createExport } from "./formats.js";

export function downloadExport(chat, format, document = globalThis.document) {
  const exported = createExport(chat, format);
  const url = URL.createObjectURL(
    new Blob([exported.content], { type: exported.mime }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = exported.filename;
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  return exported.filename;
}
