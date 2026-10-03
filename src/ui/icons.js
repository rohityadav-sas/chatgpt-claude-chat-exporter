import { formatIcons } from "./format-icons.js";
import { libraryIcons } from "./library-icons.js";
// Back arrow: Lucide arrow-left (ISC), https://lucide.dev/icons/arrow-left
const paths = {
  copy: "M9 9h12v12H9zM15 9V3H3v12h6",
  chevron: "m6 9 6 6 6-6",
  user: "M20 21v-2a7 7 0 0 0-14 0v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  invert: "M3 7h16m-4-4 4 4-4 4M21 17H5m4-4-4 4 4 4",
  back: "m12 19-7-7 7-7M5 12h14",
  close: "M6 6l12 12M6 18L18 6",
  export: "M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4",
  md: "M14 3H5v18h14V8l-5-5zm0 0v5h5M8 12h8M8 16h5",
  pdf: "M14 3H5v18h14V8l-5-5zm0 0v5h5",
  json: "M8 3H6a2 2 0 0 0-2 2v4a3 3 0 0 1-2 3 3 3 0 0 1 2 3v4a2 2 0 0 0 2 2h2m8-18h2a2 2 0 0 1 2 2v4a3 3 0 0 0 2 3 3 3 0 0 0-2 3v4a2 2 0 0 1-2 2h-2",
  txt: "M5 3h14v18H5V3zm3 5h8m-8 4h8m-8 4h5",
};
export function icon(document, kind = "export") {
  if (formatIcons[kind] || libraryIcons[kind]) {
    const source = new document.defaultView.DOMParser().parseFromString(
      formatIcons[kind] || libraryIcons[kind],
      "image/svg+xml",
    ).documentElement;
    const svg = document.importNode(source, true);
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("library-icon", "icon-" + kind);
    const colors = {
      md: "#4d74b8",
      pdf: "#cf6558",
      json: "#997638",
      txt: "#568a78",
    };
    if (colors[kind]) svg.style.color = colors[kind];
    return svg;
  }
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(svg.namespaceURI, "path");
  path.setAttribute("d", paths[kind] || paths.export);
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "1.7");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  svg.append(path);
  return svg;
}
