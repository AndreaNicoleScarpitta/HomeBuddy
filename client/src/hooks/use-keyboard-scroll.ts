import { useEffect } from "react";

/**
 * Scrolls the focused input/textarea into view when the virtual keyboard opens.
 * Without this, the keyboard overlaps the active field on many mobile browsers.
 * Uses visualViewport (supported on all modern mobile browsers) to detect the
 * keyboard opening (viewport height shrinks).
 */
export function useKeyboardScroll() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    let prevHeight = vv.height;

    function handleResize() {
      const h = vv!.height;
      if (h >= prevHeight) { prevHeight = h; return; } // keyboard closed or unchanged
      prevHeight = h;

      const el = document.activeElement as HTMLElement | null;
      if (!el || !["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return;

      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }

    vv.addEventListener("resize", handleResize);
    return () => vv.removeEventListener("resize", handleResize);
  }, []);
}
