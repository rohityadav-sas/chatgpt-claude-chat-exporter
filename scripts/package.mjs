import { readFile, readdir, stat, mkdir } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
const manifest = JSON.parse(await readFile("dist/manifest.json", "utf8"));
assert(manifest.description.length <= 132, "Manifest description exceeds 132 characters");
assert(manifest.name.length <= 75, "Manifest name exceeds 75 characters");
const paths = [...(manifest.background.scripts || [manifest.background.service_worker]), manifest.action.default_popup,
  ...Object.values(manifest.icons), ...manifest.content_scripts.flatMap(item => item.js),
  "pdf.html", "pdf.js", "offscreen.js", "direct.js", "content.js", "website.js"];
for (const file of paths) assert((await stat(path.join("dist", file))).isFile(), `Missing ${file}`);
async function inspect(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) await inspect(file);
    else assert(!/\.(map|zip|log)$/.test(item.name), `Unexpected release file ${file}`);
  }
}
await inspect("dist");
await mkdir("releases", { recursive: true });
const output = path.resolve(`releases/chatgpt-claude-exporter-${manifest.version}${process.argv.includes("--firefox") ? "-firefox" : ""}.zip`);
const quote = value => "'" + value.replaceAll("'", "''") + "'";
execFileSync("powershell.exe", ["-NoProfile", "-Command",
  `Compress-Archive -Path ${quote(path.resolve("dist/*"))} -DestinationPath ${quote(output)} -Force`], { stdio: "inherit" });
console.log(`Upload package: ${output}`);
