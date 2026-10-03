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
export function resetCompleted(button) {
  const svg = button.querySelector("svg");
  const state = svg && confirmations.get(svg);
  if (!state) return;
  clearTimeout(state.timer);
  state.animations.forEach((animation) => animation?.cancel());
  svg.innerHTML = state.original;
  confirmations.delete(svg);
}
export function completed(button) {
  const svg = button.querySelector("svg");
  if (!svg) return;
  resetCompleted(button);
  const state = { original: svg.innerHTML, animations: [], timer: null };
  confirmations.set(svg, state);
  const animate = (frames, duration) => {
    const animation = motion(svg, frames, duration);
    state.animations.push(animation);
    return animation?.finished.catch(() => {}) || Promise.resolve();
  };
  (async () => {
    await animate(
      [
        { opacity: 1, transform: "scale(1)" },
        { opacity: 0, transform: "scale(.8)" },
      ],
      100,
    );
    if (confirmations.get(svg) !== state) return;
    svg.innerHTML =
      '<path d="m5 13 4 4L19 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    const path = svg.querySelector("path");
    const draw = motion(
      path,
      [
        { strokeDasharray: "24", strokeDashoffset: "24" },
        { strokeDasharray: "24", strokeDashoffset: "0" },
      ],
      220,
    );
    state.animations.push(draw);
    await animate(
      [
        { opacity: 0, transform: "scale(.8)" },
        { opacity: 1, transform: "scale(1)" },
      ],
      180,
    );
    if (confirmations.get(svg) !== state) return;
    state.timer = setTimeout(async () => {
      await animate([{ opacity: 1 }, { opacity: 0 }], 90);
      if (confirmations.get(svg) !== state) return;
      svg.innerHTML = state.original;
      await animate([{ opacity: 0 }, { opacity: 1 }], 120);
      if (confirmations.get(svg) === state) confirmations.delete(svg);
    }, 1000);
  })();
}
