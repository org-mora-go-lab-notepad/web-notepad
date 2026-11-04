"use client";

import { Bookmark } from "lucide-react";
import { type MouseEvent, useEffect, useRef } from "react";

import { type NoteTab, type TabStatus } from "@/src/4-entity/notepad";
import { useI18n, useTouchTap } from "@/src/5-shared/hook";

import type { DashboardCardProps } from "../../type";

// The note text after its title line, used as the card preview.
const getPreview = (tab: NoteTab) => {
  const lines = tab.content.split("\n");
  const titleIndex = lines.findIndex((line) => line.trim());
  return titleIndex < 0
    ? ""
    : lines
        .slice(titleIndex + 1)
        .join("\n")
        .trim();
};

export function DashboardCard({
  tab,
  groupName,
  dragging,
  active = false,
  contextMenuTarget = false,
  onOpen,
  onOpenContextMenu,
  onDragStart,
  onDragEnd,
  onTouchDragStart,
  onTouchDragOver,
  onTouchDrop,
  dropPlacement,
  onCardDragOver,
  onCardDrop,
}: DashboardCardProps) {
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDragAtRef = useRef<number | null>(null);
  const touchCleanupRef = useRef<(() => void) | null>(null);
  const preview = getPreview(tab);
  const touchTap = useTouchTap(true);
  const { t } = useI18n();
  const touchLayout = () =>
    window.matchMedia("(max-width: 512px), (pointer: coarse)").matches;
  const cancelPendingOpen = () => {
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    openTimerRef.current = null;
  };
  const openCard = (event: MouseEvent<HTMLButtonElement>) => {
    if (
      lastDragAtRef.current !== null &&
      performance.now() - lastDragAtRef.current < 500
    ) {
      event.preventDefault();
      cancelPendingOpen();
      return;
    }
    if (!onOpenContextMenu || !touchLayout()) {
      onOpen(tab.id);
      return;
    }
    cancelPendingOpen();
    if (event.detail > 1) return;
    openTimerRef.current = setTimeout(() => onOpen(tab.id), 250);
  };

  useEffect(
    () => () => {
      cancelPendingOpen();
      touchCleanupRef.current?.();
    },
    [],
  );

  const startTouch = (event: React.TouchEvent<HTMLElement>) => {
    if (event.touches.length !== 1) return;
    touchCleanupRef.current?.();
    const touch = event.touches[0];
    const identifier = touch.identifier;
    const origin = { x: touch.clientX, y: touch.clientY };
    const scrollList =
      event.currentTarget.closest<HTMLElement>(".dashboard-list");
    let started = false;
    let overStatus: TabStatus | null = null;
    let lastPoint = origin;
    let scrollFrame: number | null = null;
    const updateTarget = () => {
      const column = document
        .elementFromPoint(lastPoint.x, lastPoint.y)
        ?.closest<HTMLElement>(".dashboard-column[data-status]");
      overStatus = (column?.dataset.status as TabStatus | undefined) ?? null;
      const target = document
        .elementFromPoint(lastPoint.x, lastPoint.y)
        ?.closest<HTMLElement>(".dashboard-card[data-tab-id]");
      const bounds = target?.getBoundingClientRect();
      onTouchDragOver(
        overStatus,
        target?.dataset.tabId === tab.id ? undefined : target?.dataset.tabId,
        bounds && lastPoint.y > bounds.top + bounds.height / 2
          ? "after"
          : "before",
      );
    };
    const scrollAtEdge = () => {
      scrollFrame = null;
      if (!scrollList || !started) return;
      const bounds = scrollList.getBoundingClientRect();
      if (lastPoint.x < bounds.left || lastPoint.x > bounds.right) return;
      const edge = 64;
      const direction =
        lastPoint.y < bounds.top + edge
          ? -Math.min(1, (bounds.top + edge - lastPoint.y) / edge)
          : lastPoint.y > bounds.bottom - edge
            ? Math.min(1, (lastPoint.y - (bounds.bottom - edge)) / edge)
            : 0;
      if (!direction) return;
      const before = scrollList.scrollTop;
      scrollList.scrollTop += direction * 14;
      if (scrollList.scrollTop !== before) {
        updateTarget();
        scrollFrame = requestAnimationFrame(scrollAtEdge);
      }
    };
    let timer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      started = true;
      timer = null;
      cancelPendingOpen();
      lastDragAtRef.current = performance.now();
      if (document.activeElement instanceof HTMLElement)
        document.activeElement.blur();
      onTouchDragStart(tab.id);
    }, 300);
    const clear = () => {
      if (timer) clearTimeout(timer);
      if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
      window.removeEventListener("touchcancel", cancel);
      touchCleanupRef.current = null;
    };
    const move = (moveEvent: TouchEvent) => {
      const point = Array.from(moveEvent.touches).find(
        (item) => item.identifier === identifier,
      );
      if (!point) return;
      if (!started) {
        if (
          Math.hypot(point.clientX - origin.x, point.clientY - origin.y) > 10
        ) {
          clear();
        }
        return;
      }
      moveEvent.preventDefault();
      lastPoint = { x: point.clientX, y: point.clientY };
      updateTarget();
      if (scrollFrame === null)
        scrollFrame = requestAnimationFrame(scrollAtEdge);
    };
    const end = (endEvent: TouchEvent) => {
      if (
        !Array.from(endEvent.changedTouches).some(
          (item) => item.identifier === identifier,
        )
      )
        return;
      clear();
      if (started) {
        lastDragAtRef.current = performance.now();
        onTouchDrop(tab.id, overStatus);
      }
    };
    const cancel = () => {
      clear();
      if (started) onTouchDrop(tab.id, null);
    };
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end);
    window.addEventListener("touchcancel", cancel);
    touchCleanupRef.current = clear;
  };

  return (
    <article
      {...touchTap}
      data-tab-id={tab.id}
      data-drop-placement={dropPlacement}
      onDragOver={onCardDragOver}
      onDrop={onCardDrop}
      className={`dashboard-card ${dragging ? "is-dragging" : ""} ${active ? "is-active" : ""} ${contextMenuTarget ? "is-context-menu-target" : ""}`}
      data-tab-color={tab.tabColor}
      draggable
      onTouchStart={(event) => {
        touchTap.onTouchStart(event);
        startTouch(event);
      }}
      onContextMenu={(event) => {
        if (touchLayout()) {
          event.preventDefault();
          return;
        }
        if (!onOpenContextMenu) return;
        event.preventDefault();
        onOpenContextMenu(tab.id, event.clientX, event.clientY);
      }}
      onDragStart={(event) => {
        if (touchLayout()) {
          event.preventDefault();
          return;
        }
        cancelPendingOpen();
        lastDragAtRef.current = performance.now();
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        onDragStart(tab.id, event);
      }}
      onDragEnd={() => {
        lastDragAtRef.current = performance.now();
        onDragEnd();
      }}
    >
      <button
        className="dashboard-card-open"
        type="button"
        aria-current={active ? "true" : undefined}
        onClick={openCard}
        onDoubleClick={(event) => {
          if (!onOpenContextMenu || !touchLayout()) return;
          event.preventDefault();
          cancelPendingOpen();
          onOpenContextMenu(tab.id, event.clientX, event.clientY);
        }}
      >
        <strong title={tab.title}>{tab.title}</strong>
        {groupName && <span className="dashboard-card-group">{groupName}</span>}
        {preview && <span className="dashboard-card-preview">{preview}</span>}
      </button>
      {tab.bookmarked && (
        <span className="dashboard-card-indicators">
          {tab.bookmarked && (
            <span
              className="dashboard-card-bookmark"
              role="img"
              aria-label={t.bookmarked}
            >
              <Bookmark size={14} strokeWidth={1.8} />
            </span>
          )}
        </span>
      )}
    </article>
  );
}
