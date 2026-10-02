import { providerLogos } from "./provider-logos.js";
// Brand marks generally fill their viewBox; the user-circle has built-in padding.
// Give every brand mark the same optical padding while preserving its artwork.
export function providerLogoSvg(provider) {
  return providerLogos[provider]?.replace(/viewBox="([^"]+)"/, (_, box) => {
    const [x, y, width, height] = box.split(/\s+/).map(Number);
    return `viewBox="${x - width / 10} ${y - height / 10} ${width * 6 / 5} ${height * 6 / 5}"`;
  });
}
