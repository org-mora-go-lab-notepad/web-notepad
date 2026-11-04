import { type PointerEvent, type RefObject, useRef } from "react";

export function useBottomSheetBackdrop(
  dialogRef: RefObject<HTMLDialogElement | null>,
  close: () => void,
) {
  const start = useRef<{ id: number; x: number; y: number } | null>(null);
  const isOutside = (event: PointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog || event.target !== dialog) return false;
    const bounds = dialog.getBoundingClientRect();
    return (
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom ||
      event.clientX < bounds.left ||
      event.clientX > bounds.right
    );
  };
  return {
    onPointerDown: (event: PointerEvent<HTMLDialogElement>) => {
      start.current =
        event.pointerType === "touch" && event.isPrimary && isOutside(event)
          ? { id: event.pointerId, x: event.clientX, y: event.clientY }
          : null;
    },
    onPointerMove: (event: PointerEvent<HTMLDialogElement>) => {
      const gesture = start.current;
      if (
        gesture?.id === event.pointerId &&
        Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 10
      )
        start.current = null;
    },
    onPointerCancel: () => {
      start.current = null;
    },
    onPointerUp: (event: PointerEvent<HTMLDialogElement>) => {
      const gesture = start.current;
      start.current = null;
      if (
        gesture?.id === event.pointerId &&
        Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) <=
          10 &&
        isOutside(event)
      )
        close();
    },
  };
}
