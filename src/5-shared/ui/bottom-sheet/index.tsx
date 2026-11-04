"use client";

import { X } from "lucide-react";
import { useId } from "react";

import { useTouchTap } from "../../hook";
import { trapFocus } from "../../util";
import {
  useBottomSheet,
  useBottomSheetBackdrop,
  useBottomSheetResize,
} from "./hook";
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
  const touchTap = useTouchTap();
  const { dialogRef, close } = useBottomSheet(onClose, returnFocusTo);
  const resize = useBottomSheetResize(dialogRef, close);
  const backdrop = useBottomSheetBackdrop(dialogRef, close);
  const { height, saveHeight } = resize;
  return (
    <dialog
      {...touchTap}
      onPointerDown={(event) => {
        touchTap.onPointerDown();
        backdrop.onPointerDown(event);
      }}
      onPointerMove={backdrop.onPointerMove}
      onPointerUp={backdrop.onPointerUp}
      onPointerCancel={backdrop.onPointerCancel}
      ref={dialogRef}
      className={`bottom-sheet ${className}`}
      data-resizing={resize.resizing || undefined}
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
        onTouchEnd={(event) => event.preventDefault()}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onPointerDown={resize.onPointerDown}
        onPointerMove={resize.onPointerMove}
        onPointerUp={resize.onPointerUp}
        onPointerCancel={resize.onPointerCancel}
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
