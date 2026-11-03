import { useEffect, useRef } from "react";

const HISTORY_KEY = "notepadBottomSheet";

export function useBottomSheet(
  onClose: () => void,
  returnFocusTo?: HTMLElement | null,
) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  const dismissRef = useRef<() => void>(() => undefined);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const anchor = returnFocusTo ?? document.activeElement;
    const overflow = document.body.style.overflow;
    const href = window.location.href;
    const marker = crypto.randomUUID();
    let ownsEntry = false;
    let dismissing = false;
    let popped = false;
    document.body.style.overflow = "hidden";
    // Focus the invoking control before showModal so native restoration never targets an editor.
    if (anchor instanceof HTMLElement) anchor.focus({ preventScroll: true });
    dialog.showModal();
    dialog
      .querySelector<HTMLButtonElement>("button")
      ?.focus({ preventScroll: true });

    // Scheduling avoids leaving an extra entry during Strict Mode's setup/cleanup check.
    const frame = requestAnimationFrame(() => {
      window.history.pushState(
        { ...window.history.state, [HISTORY_KEY]: marker },
        "",
        href,
      );
      ownsEntry = true;
    });
    const handlePop = (event: PopStateEvent) => {
      if (event.state?.[HISTORY_KEY] === marker) return;
      popped = true;
      if (dialog.open) dialog.close();
      closeRef.current();
    };
    window.addEventListener("popstate", handlePop);
    dismissRef.current = () => {
      if (dismissing) return;
      dismissing = true;
      cancelAnimationFrame(frame);
      if (ownsEntry && window.history.state?.[HISTORY_KEY] === marker) {
        window.history.back();
      } else {
        if (dialog.open) dialog.close();
        closeRef.current();
      }
    };

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("popstate", handlePop);
      if (dialog.open) dialog.close();
      document.body.style.overflow = overflow;
      if (
        !popped &&
        ownsEntry &&
        window.history.state?.[HISTORY_KEY] === marker
      ) {
        if (window.location.href === href) window.history.back();
        else {
          const state = { ...window.history.state };
          delete state[HISTORY_KEY];
          window.history.replaceState(state, "", window.location.href);
        }
      }
      if (anchor instanceof HTMLElement && anchor.isConnected)
        anchor.focus({ preventScroll: true });
    };
  }, [returnFocusTo]);

  return { dialogRef, close: () => dismissRef.current() };
}
