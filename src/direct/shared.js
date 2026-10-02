// These readers run in the page's MAIN world. Credentials stay in that world.
export async function json(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    signal: AbortSignal.timeout(12000),
    ...options,
  });
  if (!response.ok)
    throw new Error(`Conversation request failed (${response.status}).`);
  return response.json();
}

export function activeBranch(items, leaf, id, parent) {
  const nodes = new Map(items.map((item) => [String(id(item)), item]));
  if (leaf === undefined || leaf === null || !nodes.has(String(leaf)))
    throw new Error("The active conversation branch is unavailable.");
  const result = [],
    seen = new Set();
  let key = String(leaf);
  while (nodes.has(key)) {
    if (seen.has(key)) throw new Error("Invalid conversation branch.");
    seen.add(key);
    const node = nodes.get(key);
    result.push(node);
    const previous = parent(node);
    if (previous === null || previous === undefined || previous === "") break;
    key = String(previous);
    if (!nodes.has(key)) throw new Error("Conversation history is incomplete.");
  }
  return result.reverse();
}

export function message(id, role, markdown) {
  const normalized = String(role || "").toLowerCase();
  role =
    normalized === "human"
      ? "user"
      : normalized === "model"
        ? "assistant"
        : normalized;
  if (!["user", "assistant"].includes(role) || !markdown?.trim()) return null;
  return {
    id: String(id),
    stableId: true,
    role,
    markdown: markdown.trim(),
    text: markdown.trim(),
  };
}

export function partsText(parts) {
  return (parts || [])
    .map((part) =>
      typeof part === "string"
        ? part
        : part?.text ||
          (part?.content_type === "image_asset_pointer"
            ? "[Image attachment]"
            : ""),
    )
    .filter(Boolean)
    .join("\n\n");
}

export function attachmentText(files) {
  if (!Array.isArray(files)) return "";
  return files
    .map((file) => {
      const text = file?.extracted_content;
      if (typeof text === "string" && text.trim()) {
        const name = (file.file_name || file.name || "Pasted text").replace(
          /\r?\n/g,
          " ",
        );
        return `### ${name}\n\n${text}`;
      }
      return `[Attachment: ${file?.file_name || file?.name || "file"}]`;
    })
    .join("\n");
}

// Inspect only ancestors of the active transcript, never a global app-state scan.
export function reactProps(selector) {
  const element = document.querySelector(selector);
  if (!element) return [];
  const key = Object.keys(element).find((key) =>
    key.startsWith("__reactFiber"),
  );
  const result = [];
  let fiber = element[key];
  for (let depth = 0; fiber && depth < 180; depth++, fiber = fiber.return)
    if (fiber.memoizedProps) result.push(fiber.memoizedProps);
  return result;
}
