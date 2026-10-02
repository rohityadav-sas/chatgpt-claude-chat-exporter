import test from "node:test";
import assert from "node:assert/strict";
import { attachmentText } from "../src/direct/shared.js";
test("Claude pasted attachments include complete extracted text and preserve repeats", () => {
  const pasted = {
    extracted_content:
      "# Previous chat\n\nनेपाली\nrepeat\nrepeat\n```js\nconst value = 42;\n```",
  };
  const text = attachmentText([
    pasted,
    { file_name: "notes.txt", extracted_content: "Complete notes" },
  ]);
  assert.ok(text.includes(pasted.extracted_content));
  assert.ok(text.includes("Complete notes"));
  assert.ok(!text.includes("[Attachment: file]"));
});
test("Binary and unavailable attachment text retain explicit placeholders", () => {
  assert.equal(
    attachmentText([
      { file_name: "photo.png" },
      { name: "empty.txt", extracted_content: "" },
    ]),
    "[Attachment: photo.png]\n[Attachment: empty.txt]",
  );
  assert.equal(attachmentText(undefined), "");
});
