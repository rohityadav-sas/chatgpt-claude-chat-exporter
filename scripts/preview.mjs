import http from "node:http";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { extractConversation } from "../src/core/extract.js";
const fixture = new JSDOM(
  `<title>A little conversation - ChatGPT</title><main><div data-message-author-role="user"><div class="whitespace-pre-wrap">How can I keep my AI conversations?</div></div><div data-message-author-role="assistant"><div class="markdown"><h2>Keep what matters</h2><p>Export your conversation as <strong>Markdown</strong>, JSON, plain text, or PDF.</p><ul><li>Code blocks and tables stay readable.</li><li>Everything happens locally.</li></ul><pre><code class="language-js">const idea = "worth keeping";</code></pre></div></div></main>`,
);
const conversation = extractConversation(
  fixture.window.document,
  "https://chatgpt.com/c/demo",
);
const mock = `globalThis.chrome={tabs:{query:async()=>[{id:1,url:'https://chatgpt.com/c/demo'}],create:async({url})=>window.open(url)},scripting:{executeScript:async()=>[{result:{conversation:${JSON.stringify(conversation)}}}]},runtime:{getURL:path=>'/'+path,sendMessage:async()=>({error:'PDF download requires the installed Chrome extension. Load dist in chrome://extensions.'})},storage:{session:{set:async data=>{for(const [key,value] of Object.entries(data))localStorage.setItem(key,JSON.stringify(value))},get:async key=>({[key]:JSON.parse(localStorage.getItem(key)||'null')})}}};`;
http
  .createServer(async (req, res) => {
    try {
      const name =
        new URL(req.url, "http://localhost").pathname.slice(1) || "popup.html";
      if (name.includes("..") || !/^[\w.-]+$/.test(name)) {
        res.writeHead(404);
        res.end();
        return;
      }
      if (name === "mock.js") {
        res.setHeader("Content-Type", "text/javascript");
        res.end(mock);
        return;
      }
      let body = await readFile(`dist/${name}`);
      if (name.endsWith(".html"))
        body = body
          .toString()
          .replace(
            "<script src=",
            '<script src="mock.js"></script><script src=',
          );
      res.setHeader(
        "Content-Type",
        name.endsWith(".html")
          ? "text/html"
          : name.endsWith(".css")
            ? "text/css"
            : "text/javascript",
      );
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  })
  .listen(4173, "127.0.0.1", () =>
    console.log("Demo only: http://127.0.0.1:4173 (Chrome APIs mocked)"),
  );
