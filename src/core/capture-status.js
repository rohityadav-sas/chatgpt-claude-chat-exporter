export function captureStatus(capture) {
  if (!capture || capture.complete) return "";
  const reason = capture.reason || "Full conversation data could not be read.";
  return `Only visible messages are available. ${reason}`;
}
