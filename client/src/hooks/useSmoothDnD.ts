import { useRef } from "react";

// Adds a temporary 'dropping' class to a container to soften reflow via CSS transition.
export function useSmoothDnD() {
  const ref = useRef<HTMLElement | null>(null);
  function setEl(el: HTMLElement | null) { ref.current = el; }
  function onDrop() {
    if (!ref.current) return;
    ref.current.classList.add("dnd-dropping");
    window.requestAnimationFrame(() => {
      setTimeout(() => ref.current?.classList.remove("dnd-dropping"), 120);
    });
  }
  return { setEl, onDrop };
}
