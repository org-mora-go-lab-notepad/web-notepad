"use client";

import {
  Bookmark,
  BookOpen,
  Layers,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Auth } from "@/src/3-feature";
import {
  ALL_GROUP_ID,
  ALL_MY_GROUP_ID,
  ALL_SHARED_GROUP_ID,
  CORE_FOOTER_ITEM_IDS,
  UNGROUPED_GROUP_ID,
  useNotepadStore,
} from "@/src/4-entity/notepad";
import { useI18n, useMobileLayout } from "@/src/5-shared/hook";
import {
  FOOTER_PIN_REQUEST_EVENT,
  type FooterPinRequestDetail,
} from "@/src/5-shared/util";

import { MoreMenu } from "./component";
import type { FooterProps } from "./type";

const CORE_ITEMS = new Set<string>(CORE_FOOTER_ITEM_IDS);

export function Footer({
  hasGroupUpdateToday,
  dashboardOpen,
  activeGroupName,
  groupsOpen,
  searchOpen = false,
  groups = [],
  onSwipeTabs,
  onToggleDashboard,
  onToggleGroups,
  onSelectGroup = () => undefined,
  onOpenGuide,
  onOpenSettings,
  onToggleBookmarks,
  onToggleSearch,
}: FooterProps) {
  const { t } = useI18n();
  const mobile = useMobileLayout();
  const dashboardSelected = dashboardOpen && (!mobile || !groupsOpen);
  const router = useRouter();
  const footerItems = useNotepadStore((state) => state.settings.footerItems);
  const unpinnedItems = CORE_FOOTER_ITEM_IDS.filter(
    (id) => !footerItems.includes(id),
  );
  const displayedItems = [...footerItems, ...unpinnedItems];
  const iconsOnly = useNotepadStore((state) => state.settings.footerIconsOnly);
  const setFooterItems = useNotepadStore((state) => state.setFooterItems);
  const [pinMenu, setPinMenu] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const draggingItem = useRef<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    id: string;
    side: "before" | "after";
  } | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const finishDrag = () => {
    draggingItem.current = null;
    setDraggingId(null);
    setDropTarget(null);
  };
  const findDropTarget = (clientX: number) => {
    const items = Array.from(
      dockRef.current?.querySelectorAll<HTMLElement>("[data-footer-item]") ??
        [],
    );
    const visibleItems = items.filter(
      (item) => item.getClientRects().length > 0,
    );
    if (!visibleItems.length) return null;
    const next = visibleItems.find((item) => {
      const rect = item.getBoundingClientRect();
      return clientX < rect.left + rect.width / 2;
    });
    const target = next ?? visibleItems[visibleItems.length - 1];
    const id = target.dataset.footerItem!;
    return id === draggingItem.current
      ? null
      : { id, side: next ? ("before" as const) : ("after" as const) };
  };
  const swipeStart = useRef<{
    x: number;
    y: number;
    identifier: number;
    target: HTMLElement | null;
    moved: boolean;
  } | null>(null);
  const suppressSwipeClickUntil = useRef(0);

  useEffect(() => {
    const requestPin = (event: Event) => {
      const detail = (event as CustomEvent<FooterPinRequestDetail>).detail;
      if (!detail?.id) return;
      setPinMenu({ id: detail.id, x: detail.x, y: detail.y });
    };
    const close = () => setPinMenu(null);
    const closeOnKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener(FOOTER_PIN_REQUEST_EVENT, requestPin);
    window.addEventListener("resize", close);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeOnKey);
    return () => {
      window.removeEventListener(FOOTER_PIN_REQUEST_EVENT, requestPin);
      window.removeEventListener("resize", close);
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeOnKey);
    };
  }, []);

  const groupLabel = (groupId: string) => {
    if (groupId === ALL_GROUP_ID) return t.allGroup;
    if (groupId === ALL_MY_GROUP_ID) return t.allMyGroup;
    if (groupId === ALL_SHARED_GROUP_ID) return t.allSharedGroup;
    if (groupId === UNGROUPED_GROUP_ID) return t.ungrouped;
    return groups.find((group) => group.id === groupId)?.name ?? groupId;
  };

  const itemDetails = (id: string) => {
    if (id.startsWith("group:"))
      return {
        label: groupLabel(id.slice("group:".length)),
        Icon: Layers,
      };
    const details = {
      "action:guide": { label: t.guide, Icon: BookOpen },
      "action:search": { label: t.search, Icon: Search },
      "action:bookmarks": { label: t.bookmark, Icon: Bookmark },
      "action:settings": { label: t.settings, Icon: Settings },
      "account:logout": { label: t.logout, Icon: LogOut },
      "account:my-page": { label: t.myPage, Icon: UserRound },
      "account:board": { label: t.board, Icon: MessageSquare },
    } as const;
    return details[id as keyof typeof details] ?? null;
  };

  const activateItem = async (id: string) => {
    if (id === "core:groups") {
      onToggleGroups();
      return;
    }
    if (id === "core:dashboard") {
      onToggleDashboard();
      return;
    }
    if (id.startsWith("group:")) {
      onSelectGroup(id.slice("group:".length));
      return;
    }
    if (id === "action:guide") {
      if (onOpenGuide) onOpenGuide();
      else router.push("/?panel=guide");
    } else if (id === "action:search") {
      if (onToggleSearch) onToggleSearch();
      else router.push("/?panel=global-search");
    } else if (id === "action:bookmarks") {
      if (onToggleBookmarks) onToggleBookmarks();
      else router.push("/?panel=bookmarks");
    } else if (id === "action:settings") {
      if (onOpenSettings) onOpenSettings();
      else router.push("/?panel=settings");
    } else if (id === "account:my-page") router.push("/my-page");
    else if (id === "account:board") {
      if (window.location.pathname === "/board") {
        window.history.pushState(window.history.state, "", "/board");
        window.dispatchEvent(new PopStateEvent("popstate"));
      } else router.push("/board");
    } else if (id === "account:logout") {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) window.dispatchEvent(new Event("notepad-auth-changed"));
    }
  };

  const moveItem = (fromId: string, toId: string, side: "before" | "after") => {
    if (
      fromId === toId ||
      !footerItems.includes(fromId) ||
      !footerItems.includes(toId)
    )
      return;
    const next = footerItems.filter((id) => id !== fromId);
    const targetIndex = next.indexOf(toId);
    next.splice(targetIndex + (side === "after" ? 1 : 0), 0, fromId);
    if (next.every((value, index) => value === footerItems[index])) return;
    setFooterItems(next);
  };

  const itemFrame = (id: string, content: ReactNode) => (
    <div
      key={id}
      className={`footer-dock-item ${CORE_ITEMS.has(id) ? "is-core" : "is-custom"} ${id.replace(":", "-")} ${CORE_ITEMS.has(id) && !footerItems.includes(id) ? "is-unpinned" : ""} ${draggingId === id ? "is-dragging" : ""} ${dropTarget?.id === id ? `is-drop-${dropTarget.side}` : ""}`}
      data-footer-item={id}
      draggable
      onPointerDown={(event) => {
        event.currentTarget.draggable = event.pointerType === "mouse";
      }}
      onDragStart={(event) => {
        if (window.matchMedia("(max-width: 512px)").matches) {
          event.preventDefault();
          return;
        }
        draggingItem.current = id;
        setDraggingId(id);
        setPinMenu(null);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", id);
      }}
      onDragEnd={finishDrag}
      onContextMenu={(event) => {
        if (window.matchMedia("(max-width: 512px)").matches) return;
        event.preventDefault();
        setPinMenu({ id, x: event.clientX, y: event.clientY });
      }}
    >
      {content}
    </div>
  );

  const renderItem = (id: string) => {
    if (id === "core:groups")
      return itemFrame(
        id,
        <button
          className={`status-command group-select-command ${groupsOpen ? "is-active" : ""}`}
          type="button"
          onClick={onToggleGroups}
          aria-current={mobile && groupsOpen ? "page" : undefined}
          aria-expanded={groupsOpen}
          aria-haspopup="dialog"
          aria-controls="groups-menu"
          aria-label={t.toggleSidebar}
          title={t.sidebarTitle}
        >
          <span className="status-icon">
            <Layers size={16} strokeWidth={1.8} />
            {hasGroupUpdateToday && (
              <span
                className="status-dot"
                role="img"
                aria-label={t.updatedToday}
              />
            )}
          </span>
          <span className="status-label group-command-label">
            {t.groupCategory}
          </span>
          <span className="group-current-value" aria-hidden="true">
            {activeGroupName}
          </span>
        </button>,
      );
    if (id === "core:dashboard")
      return itemFrame(
        id,
        <button
          className={`status-command dashboard-command ${dashboardSelected ? "is-active" : ""}`}
          type="button"
          onClick={onToggleDashboard}
          aria-current={mobile && dashboardSelected ? "page" : undefined}
          aria-expanded={dashboardOpen}
          aria-controls="dashboard-panel"
        >
          <span className="status-icon">
            <LayoutDashboard size={16} strokeWidth={1.8} />
          </span>
          <span className="status-label">{t.dashboard}</span>
        </button>,
      );
    if (id === "core:account")
      return itemFrame(
        id,
        <div className="footer-auth">
          <Auth />
        </div>,
      );
    const details = itemDetails(id);
    if (!details) return null;
    const { Icon, label } = details;
    return itemFrame(
      id,
      <button
        type="button"
        className="status-command footer-pinned-command"
        title={label}
        aria-label={label}
        onClick={() => void activateItem(id)}
      >
        <span className="status-icon">
          <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className="status-label footer-pinned-label">{label}</span>
      </button>,
    );
  };

  return (
    <footer
      className={`footer ${iconsOnly ? "is-icons-only" : ""}`}
      data-swipe-tabs={onSwipeTabs ? "true" : "false"}
      onTouchStart={(event) => {
        // A new touch is always an independent user action. Clearing the
        // previous swipe guard here keeps its first real tap responsive.
        suppressSwipeClickUntil.current = 0;
        swipeStart.current = null;
        if (!window.matchMedia("(max-width: 512px)").matches) return;
        if (event.touches.length !== 1) return;
        const touch = event.touches[0];
        swipeStart.current = {
          x: touch.clientX,
          y: touch.clientY,
          identifier: touch.identifier,
          target:
            event.target instanceof Element
              ? event.target.closest<HTMLElement>("button, a[href]")
              : null,
          moved: false,
        };
      }}
      onTouchMove={(event) => {
        const start = swipeStart.current;
        if (!start) return;
        if (event.touches.length !== 1) {
          swipeStart.current = null;
          return;
        }
        const touch = event.touches[0];
        if (Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > 10)
          start.moved = true;
      }}
      onTouchEnd={(event) => {
        const start = swipeStart.current;
        swipeStart.current = null;
        if (!start) return;
        const touch = Array.from(event.changedTouches).find(
          (changedTouch) => changedTouch.identifier === start.identifier,
        );
        if (!touch) return;
        const horizontal = touch.clientX - start.x;
        const vertical = touch.clientY - start.y;
        if (!start.moved && Math.hypot(horizontal, vertical) <= 10) {
          const target = start.target;
          if (
            target &&
            event.currentTarget.contains(target) &&
            !target.matches(':disabled, [aria-disabled="true"]')
          ) {
            // Execute the deliberate tap even when the browser omits its
            // compatibility click after a swipe. Ignore only the duplicate.
            target.click();
            suppressSwipeClickUntil.current = performance.now() + 700;
          }
          return;
        }
        if (
          Math.abs(horizontal) < 50 ||
          Math.abs(horizontal) <= Math.abs(vertical)
        )
          return;
        // Some mobile browsers emit a compatibility click for the completed
        // swipe. Block only that click; the next real touchstart clears this
        // guard before its own click is generated.
        suppressSwipeClickUntil.current = performance.now() + 700;
        onSwipeTabs?.(horizontal < 0 ? "left" : "right");
      }}
      onTouchCancel={() => {
        swipeStart.current = null;
        suppressSwipeClickUntil.current = 0;
      }}
      onClickCapture={(event) => {
        if (
          event.target instanceof Element &&
          event.target.closest(".group-more-menu")
        ) {
          suppressSwipeClickUntil.current = 0;
          return;
        }
        const sourceCapabilities = (
          event.nativeEvent as MouseEvent & {
            sourceCapabilities?: { firesTouchEvents?: boolean } | null;
          }
        ).sourceCapabilities;
        if (
          event.detail === 0 ||
          sourceCapabilities?.firesTouchEvents === false ||
          performance.now() > suppressSwipeClickUntil.current
        ) {
          suppressSwipeClickUntil.current = 0;
          return;
        }
        suppressSwipeClickUntil.current = 0;
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <button
        type="button"
        className="footer-current-group"
        title={activeGroupName}
        aria-label={`${t.groupCategory}: ${activeGroupName}`}
        aria-expanded={groupsOpen}
        aria-controls="groups-menu"
        onClick={onToggleGroups}
      >
        {activeGroupName}
      </button>
      <div className="status-meta">
        <div
          className="footer-dock"
          ref={dockRef}
          onDragOver={(event) => {
            if (!draggingItem.current) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setDropTarget(findDropTarget(event.clientX));
            const rect = event.currentTarget.getBoundingClientRect();
            if (event.clientX < rect.left + 24)
              event.currentTarget.scrollLeft -= 12;
            else if (event.clientX > rect.right - 24)
              event.currentTarget.scrollLeft += 12;
          }}
          onDragLeave={(event) => {
            if (
              !event.currentTarget.contains(event.relatedTarget as Node | null)
            )
              setDropTarget(null);
          }}
          onDrop={(event) => {
            const fromId = draggingItem.current;
            if (!fromId) return;
            event.preventDefault();
            const target = findDropTarget(event.clientX);
            if (target) moveItem(fromId, target.id, target.side);
            finishDrag();
          }}
        >
          {displayedItems.map(renderItem)}
        </div>
      </div>
      <MoreMenu
        unpinnedItems={unpinnedItems}
        searchOpen={searchOpen}
        onActivate={(id) => void activateItem(id)}
      />
      {pinMenu &&
        createPortal(
          <div
            className="footer-pin-menu"
            role="menu"
            style={{
              left: Math.max(8, Math.min(pinMenu.x, window.innerWidth - 188)),
              top: Math.max(8, Math.min(pinMenu.y, window.innerHeight - 52)),
            }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setFooterItems(
                  footerItems.includes(pinMenu.id)
                    ? footerItems.filter((id) => id !== pinMenu.id)
                    : [...footerItems, pinMenu.id],
                );
                setPinMenu(null);
              }}
            >
              {footerItems.includes(pinMenu.id)
                ? t.unpinFromFooter
                : t.pinToFooter}
            </button>
          </div>,
          document.body,
        )}
    </footer>
  );
}
