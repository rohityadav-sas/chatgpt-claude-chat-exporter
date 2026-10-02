import { message } from "./shared.js";
export function parseGeminiBatch(text) {
  for (const line of text.split("\n")) {
    if (!line.startsWith("[")) continue;
    let rows;
    try {
      rows = JSON.parse(line);
    } catch {
      continue;
    }
    const row = rows.find((row) => row[0] === "wrb.fr" && row[1] === "hNvQHb");
    if (row?.[2]) return JSON.parse(row[2]);
  }
  throw new Error("Gemini conversation response could not be read.");
}
export function geminiMessages(turns) {
  return turns
    .slice()
    .reverse()
    .flatMap((turn) => {
      const id = turn[0]?.[1];
      const query = turn[2]?.[0]?.[0];
      const answer = turn[3]?.[0]?.[0]?.[1]?.[0];
      return [
        message(`${id}:user`, "user", query),
        message(`${id}:assistant`, "assistant", answer),
      ].filter(Boolean);
    });
}
export async function readGemini() {
  const id = location.pathname.match(/\/app\/([^/]+)/)?.[1];
  const config = window.WIZ_global_data;
  if (!id || !config?.SNlM0e)
    throw new Error("Gemini conversation session is unavailable.");
  const url = new URL("/_/BardChatUi/data/batchexecute", location.origin);
  url.search = new URLSearchParams({
    rpcids: "hNvQHb",
    "source-path": location.pathname,
    bl: config.cfb2h,
    "f.sid": config.FdrFJe,
    hl: document.documentElement.lang || "en",
    rt: "c",
  });
  const turns = [],
    cursors = new Set();
  let cursor = null;
  do {
    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      signal: AbortSignal.timeout(12000),
      body: new URLSearchParams({
        "f.req": JSON.stringify([
          [
            [
              "hNvQHb",
              JSON.stringify([`c_${id}`, 100, cursor, 1, [0], [4], null, 1]),
              null,
              "generic",
            ],
          ],
        ]),
        at: config.SNlM0e,
      }),
    });
    if (!response.ok)
      throw new Error(
        `Gemini conversation request failed (${response.status}).`,
      );
    const data = parseGeminiBatch(await response.text());
    if (!Array.isArray(data[0]))
      throw new Error("Gemini returned no conversation history.");
    turns.push(...data[0]);
    cursor = data[1];
    if (cursor && cursors.has(cursor))
      throw new Error("Gemini returned an incomplete history page.");
    cursors.add(cursor);
    if (cursors.size > 100)
      throw new Error("Gemini conversation exceeds the history page limit.");
  } while (cursor);
  return { messages: geminiMessages(turns) };
}
