let pdfReady;
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id) return false;
  if (message.type === "ai-chat-exporter:prepare-pdf") {
    pdfReady ||= new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "pdf.js";
      script.onload = () => resolve({ success: true });
      script.onerror = () => reject(Error("PDF module could not load."));
      document.head.append(script);
    });
    pdfReady.then(respond, (error) => respond({ error: error.message }));
    return true;
  }
  if (message.type !== "ai-chat-exporter:copy-clipboard") return false;
  const input = document.createElement("textarea");
  input.value = message.text;
  document.body.append(input);
  input.select();
  try {
    if (!document.execCommand("copy")) throw Error("Clipboard copy failed.");
    respond({ success: true });
  } catch (error) {
    respond({ error: error.message });
  } finally {
    input.remove();
  }
  return false;
});
