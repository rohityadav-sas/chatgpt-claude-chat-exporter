import pdfMake from "pdfmake/build/pdfmake.js";
import fonts from "pdfmake/build/vfs_fonts.js";
import { pdfDocument } from "./core/pdf-document.js";

pdfMake.addVirtualFileSystem(fonts);
let ready;
function prepareFonts() {
  if (!ready)
    ready = (async () => {
      const entries = await Promise.all(
        [
          ["Devanagari", "NotoSansDevanagari-Regular.ttf"],
          ["Mono", "NotoSansMono-Regular.ttf"],
        ].map(async ([name, file]) => {
          const response = await fetch(
            new URL("assets/fonts/" + file, location.href),
          );
          if (!response.ok)
            throw new Error("PDF font is missing. Reload the extension.");
          const bytes = new Uint8Array(await response.arrayBuffer());
          let binary = "";
          for (let start = 0; start < bytes.length; start += 8192)
            binary += String.fromCharCode(
              ...bytes.subarray(start, start + 8192),
            );
          return [name + ".ttf", btoa(binary)];
        }),
      );
      pdfMake.addVirtualFileSystem(Object.fromEntries(entries));
      pdfMake.addFonts({
        Roboto: {
          normal: "Roboto-Regular.ttf",
          bold: "Roboto-Medium.ttf",
          italics: "Roboto-Italic.ttf",
          bolditalics: "Roboto-MediumItalic.ttf",
        },
        Mono: {
          normal: "Mono.ttf",
          bold: "Mono.ttf",
          italics: "Mono.ttf",
          bolditalics: "Mono.ttf",
        },
        Devanagari: {
          normal: "Devanagari.ttf",
          bold: "Devanagari.ttf",
          italics: "Devanagari.ttf",
          bolditalics: "Devanagari.ttf",
        },
      });
    })().catch((error) => {
      ready = undefined;
      throw error;
    });
  return ready;
}
// Warm the font cache before the first export. PDFs use real selectable text.
prepareFonts().catch(() => {});
let queue = Promise.resolve();
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (
    sender.id !== chrome.runtime.id ||
    message?.type !== "ai-chat-exporter:render-pdf"
  )
    return;
  queue = queue
    .catch(() => {})
    .then(async () => {
      let last = -1;
      const progress = (percent) => {
        percent = Math.floor(percent);
        if (percent <= last) return;
        last = percent;
        chrome.runtime
          .sendMessage({
            type: "ai-chat-exporter:pdf-progress",
            requestId: message.requestId,
            clientId: message.clientId,
            percent,
          })
          .catch(() => {});
      };
      progress(5);
      await prepareFonts();
      progress(15);
      pdfMake.setProgressCallback((value) => progress(20 + value * 75));
      const started = performance.now();
      const blob = await pdfMake
        .createPdf(pdfDocument(message.conversation))
        .getBlob();
      progress(98);
      const url = URL.createObjectURL(blob);
      setTimeout(() => URL.revokeObjectURL(url), 300000);
      return { url, elapsedMs: Math.round(performance.now() - started) };
    });
  queue.then(respond, (error) => respond({ error: error.message }));
  return true;
});
