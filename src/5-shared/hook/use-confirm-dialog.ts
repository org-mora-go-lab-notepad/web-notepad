"use client";

import {
  type KeyboardEvent,
  type MouseEvent,
  type SyntheticEvent,
  useEffect,
  useId,
  useRef,
} from "react";

import { trapFocus } from "../util";

type Options = {
  onCancel: () => void;
  onKeyDown?: (
    event: KeyboardEvent<HTMLDialogElement>,
    close: (action: () => void) => void,
  ) => boolean;
};

// Modal confirm dialog: focuses Cancel, traps Tab focus, and cancels on Escape or backdrop click.
export function useConfirmDialog({ onCancel, onKeyDown }: Options) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const popupId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    cancelButtonRef.current?.focus();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  const close = (action: () => void) => {
    dialogRef.current?.close();
    action();
  };

  const dialogProps = {
    ref: dialogRef,
    role: "alertdialog",
    "aria-modal": true,
    "aria-labelledby": `${popupId}-title`,
    "aria-describedby": `${popupId}-message`,
    onKeyDown: (event: KeyboardEvent<HTMLDialogElement>) => {
      event.stopPropagation();
      if (onKeyDown?.(event, close)) return;
      trapFocus(event, "button:not(:disabled)");
    },
    onCancel: (event: SyntheticEvent<HTMLDialogElement>) => {
      event.preventDefault();
      close(onCancel);
    },
    onClick: (event: MouseEvent<HTMLDialogElement>) => {
      if (event.target === event.currentTarget) close(onCancel);
    },
  };

  return { dialogProps, cancelButtonRef, popupId, close };
}
