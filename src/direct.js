import { readDirectConversation } from "./direct/index.js";
globalThis.__aiChatExporterDirectResult = readDirectConversation().then(
  (conversation) => ({ conversation }),
  (error) => ({ error: error.message }),
);
