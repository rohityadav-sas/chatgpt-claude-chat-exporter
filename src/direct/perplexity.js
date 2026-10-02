import { json, message } from "./shared.js";
export function perplexityMessages(entries) {
  return entries
    .slice()
    .sort((a, b) => a.created_us - b.created_us)
    .flatMap((entry) => {
      let steps;
      try {
        steps = JSON.parse(entry.text);
      } catch {
        steps = [];
      }
      let answer = Array.isArray(steps)
        ? steps
            .filter((s) => s.step_type === "FINAL")
            .map((s) => s.content?.answer)
            .filter((s) => typeof s === "string")
            .join("\n\n")
        : "";
      // Newer Perplexity responses wrap the final answer in a second JSON object.
      try {
        const payload = JSON.parse(answer);
        if (typeof payload.answer === "string") answer = payload.answer;
      } catch {
        /* Plain Markdown is also valid. */
      }
      return [
        message(`${entry.uuid}:user`, "user", entry.query_str),
        message(
          `${entry.uuid}:assistant`,
          "assistant",
          answer || (!steps.length ? entry.text : ""),
        ),
      ].filter(Boolean);
    });
}
export async function readPerplexity() {
  const id = location.pathname.match(/\/search\/([^/]+)/)?.[1];
  if (!id) throw new Error("Open a Perplexity thread.");
  const entries = [],
    cursors = new Set();
  let cursor;
  let title;
  do {
    const params = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    const data = await json(`/rest/thread/${encodeURIComponent(id)}${params}`);
    entries.push(...(data.entries || []));
    title ||= data.thread_metadata?.title || data.entries?.[0]?.thread_title;
    if (!data.has_next_page) break;
    cursor = data.next_cursor;
    if (typeof cursor !== "string" || cursors.has(cursor))
      throw new Error("Perplexity history pagination is unavailable.");
    cursors.add(cursor);
    if (cursors.size > 100)
      throw new Error("Perplexity thread exceeds the history page limit.");
  } while (cursor);
  return { title, messages: perplexityMessages(entries) };
}
