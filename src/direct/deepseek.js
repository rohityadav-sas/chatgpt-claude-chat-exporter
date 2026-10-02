import { json, activeBranch, message } from "./shared.js";
export async function readDeepSeek() {
  const id = location.pathname.match(/\/chat\/s\/([^/]+)/)?.[1];
  if (!id) throw new Error("Open a saved DeepSeek conversation.");
  const raw = localStorage.getItem("userToken");
  let token;
  try {
    token = JSON.parse(raw)?.value;
  } catch {
    token = raw;
  }
  if (!token) throw new Error("DeepSeek session is unavailable.");
  const data = await json(
    `/api/v0/chat/history_messages?chat_session_id=${encodeURIComponent(id)}`,
    {
      headers: { authorization: `Bearer ${token}`, "x-client-platform": "web" },
    },
  );
  const history = data.data?.biz_data;
  if (data.code !== 0 || data.data?.biz_code !== 0 || !history)
    throw new Error("DeepSeek could not return conversation history.");
  const branch = activeBranch(
    history.chat_messages,
    history.chat_session.current_message_id,
    (m) => m.message_id,
    (m) => m.parent_id,
  );
  return {
    title: history.chat_session.title,
    messages: branch
      .map((m) =>
        message(
          m.message_id,
          m.role,
          (m.fragments || [])
            .filter((p) => ["REQUEST", "RESPONSE"].includes(p.type))
            .map((p) => p.content)
            .join("\n\n"),
        ),
      )
      .filter(Boolean),
  };
}
