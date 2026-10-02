import {
  json,
  activeBranch,
  message,
  partsText,
  attachmentText,
} from "./shared.js";
export async function readChatGPT() {
  const id = location.pathname.match(/\/c\/([^/]+)/)?.[1];
  if (!id) throw new Error("Open a saved ChatGPT conversation.");
  const session = await json("/api/auth/session");
  if (!session.accessToken)
    throw new Error("Sign in to ChatGPT to read the full conversation.");
  const data = await json(
    `/backend-api/conversation/${encodeURIComponent(id)}`,
    { headers: { Authorization: `Bearer ${session.accessToken}` } },
  );
  const branch = activeBranch(
    Object.values(data.mapping || {}),
    data.current_node,
    (node) => node.id,
    (node) => node.parent,
  );
  return {
    title: data.title,
    messages: branch
      .map((node) => {
        const m = node.message;
        if (
          !m ||
          m.metadata?.is_visually_hidden_from_conversation ||
          (m.author?.role === "assistant" && m.channel && m.channel !== "final")
        )
          return null;
        return message(
          m.id,
          m.author?.role,
          [partsText(m.content?.parts), attachmentText(m.metadata?.attachments)]
            .filter(Boolean)
            .join("\n\n"),
        );
      })
      .filter(Boolean),
  };
}
