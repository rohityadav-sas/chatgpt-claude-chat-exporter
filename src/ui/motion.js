const easing = "cubic-bezier(.2,.8,.2,1)";
export function motion(element, frames, duration = 160) {
  if (
    !element.animate ||
    element.ownerDocument.defaultView.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
  )
    return null;
  return element.animate(frames, { duration, easing });
}
const resizing = new WeakMap();
export function resize(element, change) {
  const before = element.getBoundingClientRect().height;
  resizing.get(element)?.cancel();
  change();
  const after = element.getBoundingClientRect().height;
  if (Math.abs(after - before) < 1) return;
  const animation = motion(
    element,
    [
      { height: before + "px", overflow: "hidden" },
      { height: after + "px", overflow: "hidden" },
    ],
    180,
  );
  if (animation) resizing.set(element, animation);
}
const confirmations = new WeakMap();
export function completed(button) {
  const svg = button.querySelector("svg");
  if (!svg) return;
  const existing = confirmations.get(svg);
  if (existing) clearTimeout(existing.timer);
  const previous = existing?.original || svg.innerHTML;
  svg.innerHTML =
    '<path d="m5 12 4 4L19 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  motion(svg, [
    { opacity: 0, transform: "scale(.85)" },
    { opacity: 1, transform: "scale(1)" },
  ]);
  const timer = setTimeout(() => {
    svg.innerHTML = previous;
    confirmations.delete(svg);
  }, 900);
  confirmations.set(svg, { original: previous, timer });
}
