// Qwen's browser title is often just "Qwen"; use the active chat instead.
export function qwenTitle(document, url, states = []) {
  const path = new URL(url).pathname;
  const id = path.match(/\/c\/([^/]+)/)?.[1];
  if (!id) return "";
  // Qwen marks its active sidebar link with a class, without an href.
  const activeLabel = document.querySelector(
    "a.chat-item-drag-active .chat-item-title-text, .chat-item-drag-web-active .chat-item-title-text",
  );
  const activeTitle = activeLabel?.textContent?.trim();
  if (activeTitle) return activeTitle;
  const elements = Array.from(
    document.querySelectorAll(
      "a[href], [data-chat-id], [data-conversation-id]",
    ),
  );
  const active =
    elements.find((node) => {
      if (
        node.getAttribute("data-chat-id") === id ||
        node.getAttribute("data-conversation-id") === id
      )
        return true;
      try {
        const link = new URL(node.getAttribute("href"), url);
        return link.origin === new URL(url).origin && link.pathname === path;
      } catch {
        return false;
      }
    }) ||
    document.querySelector(
      '[aria-current="page"], [aria-selected="true"][data-chat-id], [class*="sidebar"] [class*="chat"][class*="active"], [class*="chat-list"] [class*="selected"]',
    );
  if (active) {
    const label =
      active.querySelector(
        '[data-testid="chat-title"], [class*="truncate"], [class*="title"]',
      ) || active;
    const copy = label.cloneNode(true);
    copy
      .querySelectorAll('button, svg, [role="button"]')
      .forEach((node) => node.remove());
    const savedTitle = (
      label.getAttribute("title") ||
      copy.textContent ||
      ""
    ).trim();
    if (savedTitle) return savedTitle;
  }
  for (const state of states) {
    const candidates = [
      ...[state.chats, state.chatList, state.conversations].flatMap((value) =>
        Array.isArray(value) ? value : [],
      ),
      state.chat,
      state.currentChat,
      state.conversation,
    ];
    for (const chat of candidates) {
      if (chat && String(chat.id || chat.chat_id || chat.uuid) === id) {
        const title = chat.title || chat.name;
        if (typeof title === "string" && title.trim()) return title.trim();
      }
    }
  }
  return "";
}
