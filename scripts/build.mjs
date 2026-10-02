import { build } from "esbuild";
import { mkdir, copyFile, rm, cp, readFile, writeFile } from "node:fs/promises";
await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await mkdir("dist/assets", { recursive: true });
for (const name of ["icon.svg", "icon-16.png", "icon-32.png", "icon-48.png", "icon-128.png", "fonts"]) {
  await cp(`assets/${name}`, `dist/assets/${name}`, { recursive: true });
}
for (const name of ["providers", "ui-icons"]) {
  await mkdir(`dist/assets/${name}`, { recursive: true });
  await copyFile(`assets/${name}/LICENSE.txt`, `dist/assets/${name}/LICENSE.txt`);
}
await copyFile("THIRD-PARTY-NOTICES.txt", "dist/THIRD-PARTY-NOTICES.txt");
for (const name of ["popup.html", "popup.css", "pdf.html"]) {
  await copyFile(name, `dist/${name}`);
}
// Support loading either the repository root or the standalone dist folder.
const manifest = JSON.parse(await readFile("manifest.json", "utf8"));
manifest.action.default_popup = "popup.html";
manifest.background.service_worker = "background.js";
manifest.content_scripts.forEach((script) => {
  script.js = script.js.map((name) => name.replace(/^dist\//, ""));
});
await writeFile("dist/manifest.json", JSON.stringify(manifest, null, 2));
const options = {
  outdir: "dist",
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "chrome120",
  sourcemap: !process.argv.includes("--release"),
  minify: process.argv.includes("--release"),
  loader: { ".css": "text", ".svg": "text" },
  define: { __EXPORTER_BUILD_VERSION__: JSON.stringify(manifest.version) },
};
await build({
  ...options,
  entryPoints: [
    "src/popup.js",
    "src/pdf.js",
    "src/offscreen.js",
    "src/in-page.js",
    "src/background.js",
  ],
});
await build({
  ...options,
  entryPoints: ["src/content.js"],
  footer: {
    js: "(() => { const result = globalThis.__aiChatExporterResult; delete globalThis.__aiChatExporterResult; return result; })();",
  },
});
await build({
  ...options,
  entryPoints: ["src/direct.js"],
  footer: {
    js: "(() => { const result = globalThis.__aiChatExporterDirectResult; delete globalThis.__aiChatExporterDirectResult; return result; })();",
  },
});
console.log("Extension ready: load the dist folder in chrome://extensions");

await build({
  ...options,
  entryPoints: ["src/website.js"],
  footer: {
    js: "(() => { const result = globalThis.__websiteMarkdownResult; delete globalThis.__websiteMarkdownResult; return result; })();",
  },
});
