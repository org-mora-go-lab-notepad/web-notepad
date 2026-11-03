"use client";

import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useEffect,
} from "react";

const WIDTH_PROPERTY = "--group-sidebar-width";
const WIDTH_STORAGE_KEY = "web-notepad-group-sidebar-width";

// Read the CSS limits so drag behavior cannot drift from the drawer's layout.
const clampWidth = (width: number, menu: HTMLElement) => {
  const style = getComputedStyle(menu);
  const minimum = parseFloat(style.minWidth) || 0;
  const maximum = parseFloat(style.maxWidth) || window.innerWidth;
  return Math.round(Math.min(Math.max(width, minimum), Math.floor(maximum)));
};

const applyWidth = (width: number) =>
  document.documentElement.style.setProperty(WIDTH_PROPERTY, `${width}px`);

export function useGroupMenuResize(menuRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    try {
      const stored = Number(localStorage.getItem(WIDTH_STORAGE_KEY));
      if (stored > 0 && menuRef.current)
        applyWidth(clampWidth(stored, menuRef.current));
    } catch {
      // Storage is unavailable; keep the default width.
    }
  }, [menuRef]);

  return useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!menuRef.current) return;
      event.preventDefault();
      const startWidth = menuRef.current.getBoundingClientRect().width;
      const startX = event.clientX;
      const right =
        menuRef.current
          .closest("[data-group-position]")
          ?.getAttribute("data-group-position") === "right";
      let width: number | null = null;
      const handleMove = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientX - startX;
        width = clampWidth(
          startWidth + (right ? -delta : delta),
          menuRef.current!,
        );
        applyWidth(width);
      };
      const handleUp = () => {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
        if (width === null) return;
        try {
          localStorage.setItem(WIDTH_STORAGE_KEY, String(width));
        } catch {
          // Storage is unavailable; the width lasts for this visit.
        }
      };
      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
    },
    [menuRef],
  );
}
