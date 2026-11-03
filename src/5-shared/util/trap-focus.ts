import type { KeyboardEvent } from "react";

// Keep sequential keyboard navigation within a modal without scrolling its content.
export function trapFocus(
  event: KeyboardEvent<HTMLElement>,
  selector = 'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
) {
  if (event.key !== "Tab") return;
  const controls = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(selector),
  ).filter(
    (element) =>
      element.getClientRects().length > 0 && !element.closest("[inert]"),
  );
  const first = controls[0];
  const last = controls.at(-1);
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus({ preventScroll: true });
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus({ preventScroll: true });
  }
}
