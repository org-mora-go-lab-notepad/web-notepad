import {
  type PointerEvent,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";

const clamp = (height: number) => Math.max(25, Math.min(100, height));
const snap = (height: number) => clamp(Math.round(height / 25) * 25);

export function useBottomSheetResize(
  dialogRef: RefObject<HTMLDialogElement | null>,
  close: () => void,
) {
  const [height, setHeight] = useState(() => {
    try {
      const saved = Number(localStorage.getItem("notepad-sheet-height"));
      return [25, 50, 75, 100].includes(saved) ? saved : 75;
    } catch {
      return 75;
    }
  });
  const [resizing, setResizing] = useState(false);
  const gesture = useRef<{
    pointerId: number;
    y: number;
    height: number;
    samples: { y: number; time: number }[];
  } | null>(null);
  const animation = useRef<Animation | null>(null);
  useEffect(() => () => animation.current?.cancel(), []);

  const saveHeight = (value: number) => {
    setHeight(value);
    try {
      localStorage.setItem("notepad-sheet-height", String(value));
    } catch {
      /* Preserve the current session when storage is unavailable. */
    }
  };
  const sample = (event: PointerEvent<HTMLDivElement>) => {
    const drag = gesture.current;
    if (!drag || drag.pointerId !== event.pointerId) return null;
    drag.samples.push({ y: event.clientY, time: event.timeStamp });
    drag.samples = drag.samples.filter(
      (point) => event.timeStamp - point.time <= 120,
    );
    return drag;
  };
  return {
    height,
    resizing,
    saveHeight,
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      if (!event.isPrimary || event.button !== 0 || animation.current) return;
      const current =
        ((dialogRef.current?.getBoundingClientRect().height ?? 0) /
          window.innerHeight) *
        100;
      gesture.current = {
        pointerId: event.pointerId,
        y: event.clientY,
        height: current || height,
        samples: [{ y: event.clientY, time: event.timeStamp }],
      };
      setHeight(current || height);
      setResizing(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      const drag = sample(event);
      if (drag)
        setHeight(
          clamp(
            drag.height + ((drag.y - event.clientY) / window.innerHeight) * 100,
          ),
        );
    },
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => {
      const drag = sample(event);
      if (!drag) return;
      gesture.current = null;
      setResizing(false);
      const first = drag.samples[0];
      const elapsed = event.timeStamp - first.time;
      const velocity = elapsed > 0 ? (event.clientY - first.y) / elapsed : 0;
      const distance = event.clientY - drag.y;
      if (velocity > 1.35 && distance >= 40) {
        // Keep the last settled height when dismissing, including on reopening.
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          close();
          return;
        }
        const slide = dialogRef.current?.animate(
          [{ transform: "translateY(0)" }, { transform: "translateY(100%)" }],
          { duration: 180, easing: "ease-out", fill: "forwards" },
        );
        if (!slide) {
          close();
          return;
        }
        animation.current = slide;
        void slide.finished.then(close).catch(() => undefined);
        return;
      }
      const dragged = clamp(
        drag.height - (distance / window.innerHeight) * 100,
      );
      const flick = Math.abs(velocity) >= 0.45 && Math.abs(distance) >= 12;
      const next = flick
        ? velocity < 0
          ? Math.max(snap(dragged), snap(drag.height) + 25)
          : Math.min(snap(dragged), snap(drag.height) - 25)
        : snap(dragged);
      saveHeight(clamp(next));
    },
    onPointerCancel: () => {
      const drag = gesture.current;
      gesture.current = null;
      setResizing(false);
      if (drag) setHeight(snap(drag.height));
    },
  };
}
