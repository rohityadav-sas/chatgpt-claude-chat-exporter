import { json, activeBranch, message, attachmentText } from "./shared.js";
export async function readClaude() {
  const id = location.pathname.match(/\/chat\/([^/]+)/)?.[1];
  if (!id) throw new Error("Open a saved Claude conversation.");
  let org = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith("lastActiveOrg="))
    ?.split("=")[1];
  if (!org) org = (await json("/api/organizations"))[0]?.uuid;
  if (!org) throw new Error("Claude organization is unavailable.");
  const data = await json(
    `/api/organizations/${encodeURIComponent(org)}/chat_conversations/${encodeURIComponent(id)}?tree=True&rendering_mode=messages&render_all_tools=true`,
  );
  const branch = activeBranch(
    data.chat_messages || [],
    data.current_leaf_message_uuid,
    (m) => m.uuid,
    (m) =>
      m.parent_message_uuid === "00000000-0000-4000-8000-000000000000"
        ? null
        : m.parent_message_uuid,
  );
  return {
    title: data.name,
    messages: branch
      .map((m) => {
        const text =
          (m.content || [])
            .filter((part) => part.type === "text")
            .map((part) => part.text)
            .join("\n\n") || m.text;
        const attachments = attachmentText([
          ...(m.attachments || []),
          ...(m.files || []),
        ]);
        const normalized = message(
          m.uuid,
          m.sender,
          [text, attachments].filter(Boolean).join("\n\n"),
        );
        if (!normalized) return null;
        return {
          ...normalized,
          bodyMarkdown: text || "",
          attachments: [...(m.attachments || []), ...(m.files || [])].map(
            (file) => ({
              name: file.file_name || file.name || "Pasted text",
              text:
                typeof file.extracted_content === "string"
                  ? file.extracted_content
                  : "",
            }),
          ),
        };
      })
      .filter(Boolean),
  };
}
