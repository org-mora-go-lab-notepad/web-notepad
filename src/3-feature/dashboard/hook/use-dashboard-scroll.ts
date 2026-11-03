import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

export function useDashboardScroll(
  open: boolean,
  activeTabId?: string,
  mobileLayout = false,
) {
  const contentRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const scrollToCard = useCallback((id?: string) => {
    const list = listRef.current;
    const card = Array.from(
      boardRef.current?.querySelectorAll<HTMLElement>(".dashboard-card") ?? [],
    ).find((card) => card.dataset.tabId === id);
    if (!list || !card || !list.getClientRects().length) return;
    const bounds = list.getBoundingClientRect(),
      item = card.getBoundingClientRect();
    if (item.top < bounds.top) list.scrollTop += item.top - bounds.top - 8;
    else if (item.bottom > bounds.bottom)
      list.scrollTop += item.bottom - bounds.bottom + 8;
  }, []);
  useLayoutEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => scrollToCard(activeTabId));
    return () => cancelAnimationFrame(frame);
  }, [open, activeTabId, mobileLayout, scrollToCard]);

  useEffect(() => {
    const content = contentRef.current;
    const list = listRef.current;
    const board = boardRef.current;
    if (!content || !list || !board) return;

    const updateScrollbarWidth = () => {
      content.style.setProperty(
        "--dashboard-scrollbar-width",
        `${list.offsetWidth - list.clientWidth}px`,
      );
      updateScrollState();
    };
    const updateScrollState = () =>
      content.classList.toggle("is-scrolled", list.scrollTop > 0);
    const observer = new ResizeObserver(updateScrollbarWidth);
    observer.observe(list);
    observer.observe(board);
    updateScrollbarWidth();
    list.addEventListener("scroll", updateScrollState, { passive: true });
    return () => {
      observer.disconnect();
      list.removeEventListener("scroll", updateScrollState);
    };
  }, []);

  return { contentRef, listRef, boardRef, scrollToCard };
}
