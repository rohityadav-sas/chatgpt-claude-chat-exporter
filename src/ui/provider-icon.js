import { providerLogoSvg } from "../core/provider-logo-display.js";
export function providerIcon(document, provider) {
  const source = providerLogoSvg(provider);
  if (!source) return document.createElement("span");
  const svg = new document.defaultView.DOMParser().parseFromString(
    source,
    "image/svg+xml",
  ).documentElement;
  const result = document.importNode(svg, true);
  result.classList.add("provider-icon");
  result.setAttribute("aria-hidden", "true");
  result.setAttribute("width", "15");
  result.setAttribute("height", "16");
  return result;
}
