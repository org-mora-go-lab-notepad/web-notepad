import { type MouseEvent, type TouchEvent, useRef } from "react";

// Mobile browsers may omit a compatibility click immediately after a pan.
export function useTouchTap(doubleTap = false) {
  const start = useRef<{
    id: number;
    x: number;
    y: number;
    target: HTMLElement;
  } | null>(null);
  const duplicate = useRef<HTMLElement | null>(null);
  const lastTap = useRef<{ target: HTMLElement; time: number } | null>(null);
  return {
    onPointerDown: () => {
      duplicate.current = null;
    },
    onTouchStart: (event: TouchEvent<HTMLElement>) => {
      duplicate.current = null;
      start.current = null;
      if (event.touches.length !== 1 || !(event.target instanceof Element))
        return;
      const target = event.target.closest<HTMLElement>(
        'button, [role="button"]',
      );
      if (
        !target ||
        !event.currentTarget.contains(target) ||
        target.matches(':disabled, [aria-disabled="true"]')
      )
        return;
      const touch = event.touches[0];
      start.current = {
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
        target,
      };
    },
    onTouchMove: (event: TouchEvent<HTMLElement>) => {
      const gesture = start.current;
      const touch = Array.from(event.touches).find(
        (item) => item.identifier === gesture?.id,
      );
      if (
        gesture &&
        (!touch ||
          event.touches.length !== 1 ||
          Math.hypot(touch.clientX - gesture.x, touch.clientY - gesture.y) > 10)
      )
        start.current = null;
    },
    onTouchCancel: () => {
      start.current = null;
      duplicate.current = null;
    },
    onTouchEnd: (event: TouchEvent<HTMLElement>) => {
      const gesture = start.current;
      start.current = null;
      if (!gesture || event.touches.length) return;
      const touch = Array.from(event.changedTouches).find(
        (item) => item.identifier === gesture.id,
      );
      if (
        !touch ||
        Math.hypot(touch.clientX - gesture.x, touch.clientY - gesture.y) > 10
      )
        return;
      const bounds = gesture.target.getBoundingClientRect();
      if (
        touch.clientX < bounds.left ||
        touch.clientX > bounds.right ||
        touch.clientY < bounds.top ||
        touch.clientY > bounds.bottom
      )
        return;
      const previous = lastTap.current;
      const time = performance.now();
      if (
        doubleTap &&
        previous?.target === gesture.target &&
        time - previous.time < 300
      ) {
        lastTap.current = null;
        gesture.target.dispatchEvent(
          new window.MouseEvent("dblclick", {
            bubbles: true,
            cancelable: true,
            detail: 2,
            clientX: touch.clientX,
            clientY: touch.clientY,
          }),
        );
      } else {
        lastTap.current = { target: gesture.target, time };
        gesture.target.click();
      }
      duplicate.current = gesture.target;
    },
    onClickCapture: (event: MouseEvent<HTMLElement>) => {
      const target = duplicate.current;
      const capabilities = (
        event.nativeEvent as globalThis.MouseEvent & {
          sourceCapabilities?: { firesTouchEvents?: boolean } | null;
        }
      ).sourceCapabilities;
      if (
        !target ||
        event.detail === 0 ||
        capabilities?.firesTouchEvents === false
      )
        return;
      duplicate.current = null;
      if (event.target instanceof Node && target.contains(event.target)) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
  };
}
