// Stable DOM identities let scroll capture retain identical repeated messages.
export function messageIdentity(node, role, index) {
  const direct =
    node.getAttribute("data-message-id") || node.getAttribute("data-msg-id");
  const plane = node
    .closest("[data-plane-row]")
    ?.getAttribute("data-plane-row");
  const virtual = node
    .closest("[data-virtual-list-item-key]")
    ?.getAttribute("data-virtual-list-item-key");
  const transcript = node
    .closest('[data-testid="transcript-row"]')
    ?.getAttribute("data-index");
  const gemini = node.matches("user-query, model-response")
    ? node.closest("[id]")?.id
    : undefined;
  const qwen = node.querySelector(".chat-response-message[id]")?.id;
  const id =
    direct || plane || virtual || transcript || gemini || qwen || node.id;
  return {
    id: id ? `${role}:${id}` : `message-${index + 1}`,
    stableId: Boolean(id),
  };
}
