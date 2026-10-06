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
if (process.argv.includes("--firefox")) {
  manifest.background = { scripts: ["background.js"] };
  manifest.permissions = manifest.permissions.filter(permission => permission !== "offscreen");
  delete manifest.minimum_chrome_version;
  manifest.browser_specific_settings = { gecko: { id: "chatgpt-claude-exporter@rohityadav.se", strict_min_version: "142.0", data_collection_permissions: { required: ["none"] } } };
}
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
  define: { __EXPORTER_BUILD_VERSION__: JSON.stringify(manifest.version), __FIREFOX_BUILD__: String(process.argv.includes("--firefox")) },
  plugins: [{
    name: "pdfmake-csp-compatible-helpers",
    setup(builder) {
      builder.onLoad({filter: /[\\/]pdfmake[\\/]build[\\/]pdfmake\.js$/}, async ({path}) => {
        let contents = await readFile(path, "utf8");
        // These bundled helpers support obsolete engines. Modern extension
        // targets have globalThis, native bind and literal async/generator syntax.
        // Exact matches fail the build if an upstream update needs a fresh review.
        const replacements = [
          ["'%eval%': eval", "'%eval%': undefined"],
          ['new Function("return this")()', 'globalThis'],
          ["new Function('return this')()", 'globalThis'],
          ["Function('return this')()", 'globalThis'],
          ["Function('binder', 'return function (' + joiny(boundArgs, ',') + '){ return binder.apply(this,arguments); }')(binder)", 'function () { return binder.apply(this, arguments); }'],
          ["$Function('\"use strict\"; return (' + expressionSyntax + ').constructor;')()", "({ 'async function () {}': (async function () {}).constructor, 'function* () {}': (function* () {}).constructor, 'async function* () {}': (async function* () {}).constructor })[expressionSyntax]"],
        ];
        for (const [original, replacement] of replacements) {
          if (!contents.includes(original)) throw Error("PDF compatibility helper changed: " + original);
          contents = contents.replaceAll(original, replacement);
        }
        return {contents, loader:"js"};
      });
    },
  }],
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
