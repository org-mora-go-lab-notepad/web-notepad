"use client";

import { X } from "lucide-react";
import { useId } from "react";

import { trapFocus } from "../../util";
import { useBottomSheet } from "./hook";
import type { BottomSheetProps } from "./type";

export function BottomSheet({
  title,
  closeLabel,
  className = "",
  onClose,
  returnFocusTo,
  children,
}: BottomSheetProps) {
  const titleId = useId();
  const { dialogRef, close } = useBottomSheet(onClose, returnFocusTo);
  return (
    <dialog
      ref={dialogRef}
      className={`bottom-sheet ${className}`}
      aria-modal="true"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onKeyDown={(event) => {
        event.stopPropagation();
        trapFocus(event);
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
      <div className="bottom-sheet-grip" aria-hidden="true" />
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
