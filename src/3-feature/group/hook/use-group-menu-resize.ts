"use client";

import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useEffect,
} from "react";

const MIN_WIDTH = 192;
const MAX_WIDTH_RATIO = 0.51;
const WIDTH_PROPERTY = "--group-sidebar-width";
const WIDTH_STORAGE_KEY = "web-notepad-group-sidebar-width";

const clampWidth = (width: number) =>
  Math.round(
    Math.min(
      Math.max(width, MIN_WIDTH),
      Math.floor(window.innerWidth * MAX_WIDTH_RATIO),
    ),
  );

const applyWidth = (width: number) =>
  document.documentElement.style.setProperty(WIDTH_PROPERTY, `${width}px`);

export function useGroupMenuResize(menuRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    try {
      const stored = Number(localStorage.getItem(WIDTH_STORAGE_KEY));
      if (stored > 0) applyWidth(clampWidth(stored));
    } catch {
      // Storage is unavailable; keep the default width.
    }
  }, []);

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
        width = clampWidth(startWidth + (right ? -delta : delta));
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
