import { json, activeBranch, message } from "./shared.js";
export async function readGrok() {
  const id = location.pathname.match(/\/c\/([^/]+)/)?.[1];
  if (!id) throw new Error("Open a saved Grok conversation.");
  const data = await json(
    `/rest/app-chat/conversations/${encodeURIComponent(id)}/responses`,
  );
  const responses = data.responses || [];
  const selected = new URL(location.href).searchParams.get("rid");
  const leaf =
    selected && responses.some((m) => m.responseId === selected)
      ? selected
      : responses
          .filter(
            (m) =>
              !responses.some(
                (child) => child.parentResponseId === m.responseId,
              ),
          )
          .sort((a, b) =>
            String(a.createTime).localeCompare(String(b.createTime)),
          )
          .at(-1)?.responseId;
  const branch = activeBranch(
    responses,
    leaf,
    (m) => m.responseId,
    // Grok's first prompt references an unreturned synthetic root node.
    (m) =>
      m === responses[0] && m.sender === "human" ? null : m.parentResponseId,
  );
  return {
    messages: branch
      .map((m) =>
        message(
          m.responseId,
          m.sender,
          [
            m.message,
            ...(m.imageAttachments || []).map(() => "[Image attachment]"),
            ...(m.fileAttachments || []).map(() => "[File attachment]"),
          ]
            .filter(Boolean)
            .join("\n\n"),
        ),
      )
      .filter(Boolean),
  };
}
