"use client";

import { X } from "lucide-react";
import { useId, useRef, useState } from "react";

import { trapFocus } from "../../util";
import { useBottomSheet } from "./hook";
import type { BottomSheetProps } from "./type";

export function BottomSheet({
  title,
  closeLabel,
  resizeLabel,
  className = "",
  onClose,
  returnFocusTo,
  children,
}: BottomSheetProps) {
  const titleId = useId();
  const [height, setHeight] = useState(() => {
    try {
      const saved = Number(localStorage.getItem("notepad-sheet-height"));
      return [25, 50, 75, 100].includes(saved) ? saved : 75;
    } catch {
      return 75;
    }
  });
  const dragStart = useRef<{ y: number; height: number } | null>(null);
  const saveHeight = (value: number) => {
    setHeight(value);
    try {
      localStorage.setItem("notepad-sheet-height", String(value));
    } catch {
      /* Keep the current session usable without storage. */
    }
  };

  const { dialogRef, close } = useBottomSheet(onClose, returnFocusTo);
  return (
    <dialog
      ref={dialogRef}
      className={`bottom-sheet ${className}`}
      style={{ height: `${height}dvh` }}
      aria-modal="true"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (!event.defaultPrevented) trapFocus(event);
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom ||
          event.clientX < bounds.left ||
          event.clientX > bounds.right
        )
          close();
      }}
    >
      <div
        className="bottom-sheet-grip"
        role="slider"
        tabIndex={0}
        aria-label={resizeLabel}
        aria-orientation="vertical"
        aria-valuemin={25}
        aria-valuemax={100}
        aria-valuenow={height}
        onPointerDown={(event) => {
          dragStart.current = { y: event.clientY, height };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const start = dragStart.current;
          if (start)
            setHeight(
              Math.max(
                25,
                Math.min(
                  100,
                  start.height +
                    ((start.y - event.clientY) / window.innerHeight) * 100,
                ),
              ),
            );
        }}
        onPointerUp={(event) => {
          const start = dragStart.current;
          if (!start) return;
          dragStart.current = null;
          const next =
            start.height +
            ((start.y - event.clientY) / window.innerHeight) * 100;
          saveHeight(Math.max(25, Math.min(100, Math.round(next / 25) * 25)));
        }}
        onPointerCancel={() => {
          dragStart.current = null;
          saveHeight(Math.round(height / 25) * 25);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            saveHeight(
              Math.max(
                25,
                Math.min(100, height + (event.key === "ArrowUp" ? 25 : -25)),
              ),
            );
          }
        }}
      />
      <header className="bottom-sheet-header">
        <h2 id={titleId}>{title}</h2>
        <button type="button" aria-label={closeLabel} onClick={close}>
          <X size={20} aria-hidden="true" />
        </button>
      </header>
      <div className="bottom-sheet-content" tabIndex={0}>
        {children}
      </div>
    </dialog>
  );
}
