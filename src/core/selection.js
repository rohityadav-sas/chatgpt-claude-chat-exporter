// Select by position: repeated messages and duplicate provider IDs stay distinct.
export class MessageSelection {
  constructor(messages) {
    this.messages = messages;
    this.indices = new Set(messages.map((_, index) => index));
  }
  get count() {
    return this.indices.size;
  }
  toggle(index, selected) {
    if (!Number.isInteger(index) || index < 0 || index >= this.messages.length)
      return;
    if (selected) this.indices.add(index);
    else this.indices.delete(index);
  }
  select(mode) {
    if (mode === "invert") {
      this.indices = new Set(
        this.messages
          .map((_, index) => index)
          .filter((index) => !this.indices.has(index)),
      );
      return;
    }
    if (!["all", "none", "user", "assistant"].includes(mode))
      throw new Error("Unknown message selection.");
    this.indices = new Set(
      this.messages.flatMap((message, index) =>
        mode === "all" || message.role === mode ? [index] : [],
      ),
    );
  }
  apply(conversation) {
    if (!this.count) throw new Error("Select at least one message to export.");
    return {
      ...conversation,
      messages: conversation.messages.filter((_, index) =>
        this.indices.has(index),
      ),
      selection: { selected: this.count, total: this.messages.length },
      scope: `${conversation.scope} Export includes ${this.count} of ${this.messages.length} available messages selected by the user.`,
    };
  }
}
