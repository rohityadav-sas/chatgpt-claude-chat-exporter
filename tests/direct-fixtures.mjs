const prompt = "Keep नेपाली and code.";
const answer = "**Answer**\n\n```js\nconst n = 42;\n```";
export async function installDirectFixture(page, provider) {
  await page.addInitScript(
    ({ provider, prompt, answer }) => {
      localStorage.setItem(
        "userToken",
        JSON.stringify({ value: "fixture-only-token" }),
      );
      document.cookie = "lastActiveOrg=fixture-org;path=/";
      window.WIZ_global_data = {
        SNlM0e: "fixture-only-token",
        cfb2h: "fixture",
        FdrFJe: "fixture",
      };
      if (["qwen", "mistral"].includes(provider))
        document.addEventListener("DOMContentLoaded", () => {
          const element = document.querySelector(
            provider === "qwen"
              ? ".qwen-chat-message"
              : "[data-message-author-role]",
          );
          element.__reactFiber$fixture = {
            memoizedProps: {
              currentChat: {
                id: location.pathname.split("/").at(-1),
                title: "what are you capable of?",
              },
              messages: [
                { id: "q", role: "user", content: prompt },
                {
                  id: "a",
                  role: "assistant",
                  content: provider === "qwen" ? "" : answer,
                  content_list: [
                    { phase: "thinking_summary", content: "PRIVATE THINKING" },
                    { phase: "answer", content: answer },
                  ],
                },
              ],
            },
            return: null,
          };
        });
    },
    { provider, prompt, answer },
  );
  await page.route(
    /\/(?:api\/|backend-api\/|rest\/|_\/BardChatUi\/data\/)/,
    async (route) => {
      const url = new URL(route.request().url());
      let data;
      if (url.pathname === "/api/auth/session")
        data = { accessToken: "fixture-only-token" };
      else if (provider === "chatgpt")
        data = {
          title: "API conversation",
          current_node: "a",
          mapping: {
            root: { id: "root", parent: null },
            q: {
              id: "q",
              parent: "root",
              message: {
                id: "q",
                author: { role: "user" },
                content: { parts: [prompt] },
              },
            },
            a: {
              id: "a",
              parent: "q",
              message: {
                id: "a",
                author: { role: "assistant" },
                channel: "final",
                content: { parts: [answer] },
              },
            },
            alternate: {
              id: "alternate",
              parent: "q",
              message: {
                id: "alternate",
                author: { role: "assistant" },
                content: { parts: ["WRONG BRANCH"] },
              },
            },
          },
        };
      else if (provider === "claude")
        data = {
          name: "API conversation",
          current_leaf_message_uuid: "a",
          chat_messages: [
            {
              uuid: "q",
              parent_message_uuid: "00000000-0000-4000-8000-000000000000",
              sender: "human",
              attachments: [
                {
                  id: "pasted",
                  extracted_content:
                    "# Pasted conversation\n\nPASTED_TEXT_INCLUDED नेपाली",
                },
              ],
              content: [{ type: "text", text: prompt }],
            },
            {
              uuid: "a",
              parent_message_uuid: "q",
              sender: "assistant",
              content: [
                { type: "thinking", thinking: "PRIVATE THINKING" },
                { type: "text", text: answer },
              ],
            },
          ],
        };
      else if (provider === "deepseek")
        data = {
          code: 0,
          data: {
            biz_code: 0,
            biz_data: {
              chat_session: {
                title: "API conversation",
                current_message_id: 2,
              },
              chat_messages: [
                {
                  message_id: 1,
                  parent_id: null,
                  role: "USER",
                  fragments: [{ type: "REQUEST", content: prompt }],
                },
                {
                  message_id: 2,
                  parent_id: 1,
                  role: "ASSISTANT",
                  fragments: [
                    { type: "THINK", content: "PRIVATE THINKING" },
                    { type: "RESPONSE", content: answer },
                  ],
                },
              ],
            },
          },
        };
      else if (provider === "grok")
        data = {
          responses: [
            {
              responseId: "q",
              parentResponseId: "synthetic-root",
              sender: "human",
              message: prompt,
            },
            {
              responseId: "a",
              parentResponseId: "q",
              sender: "assistant",
              message: answer,
              createTime: "2026-01-01",
            },
          ],
        };
      else if (provider === "perplexity")
        data = {
          entries: [
            {
              uuid: "entry",
              created_us: 1,
              query_str: prompt,
              text: JSON.stringify([
                {
                  step_type: "FINAL",
                  content: { answer: JSON.stringify({ answer }) },
                },
              ]),
            },
          ],
          has_next_page: false,
        };
      else if (provider === "gemini") {
        const turn = [
          ["c_header-test", "r_one"],
          null,
          [[prompt]],
          [[["candidate", [answer]]]],
        ];
        await route.fulfill({
          contentType: "application/json",
          body: `)]}'\n\n10\n${JSON.stringify([["wrb.fr", "hNvQHb", JSON.stringify([[turn], null])]])}\n`,
        });
        return;
      }
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(data || {}),
      });
    },
  );
}
