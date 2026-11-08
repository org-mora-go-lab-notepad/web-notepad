import {
  Bookmark,
  BookOpen,
  Layers,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Search,
  Settings,
} from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Auth, Theme } from "@/src/3-feature";
import { useI18n } from "@/src/5-shared/hook";
import { requestFooterPin } from "@/src/5-shared/util";

import type { MoreMenuProps } from "../type";

const subscribeToClient = () => () => undefined;

export function MoreMenu({
  authenticated,
  searchOpen,
  unpinnedItems,
  onActivate,
}: MoreMenuProps) {
  const { t } = useI18n();
  const ready = useSyncExternalStore(
    subscribeToClient,
    () => true,
    () => false,
  );
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest(".auth-menu, .footer-pin-menu")
      )
        return;
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || document.querySelector(".footer-pin-menu"))
        return;
      if (document.activeElement?.closest(".auth-menu")) return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape, true);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape, true);
    };
  }, [open]);

  const actions = [
    { id: "action:guide", label: t.guide, Icon: BookOpen },
    { id: "action:search", label: t.search, Icon: Search },
    { id: "action:bookmarks", label: t.bookmark, Icon: Bookmark },
    { id: "action:settings", label: t.settings, Icon: Settings },
    ...(authenticated
      ? [{ id: "account:board", label: t.board, Icon: MessageSquare }]
      : []),
  ];
  return (
    <div className="footer-more" ref={container}>
      <button
        ref={trigger}
        type="button"
        className="more-command"
        disabled={!ready}
        aria-label={t.menu}
        title={t.menu}
        aria-expanded={open}
        aria-controls="group-more-menu"
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <Menu size={24} strokeWidth={1.8} aria-hidden="true" />
        <span className="more-command-label">{t.menu}</span>
      </button>
      {open && (
        <div
          className="group-more-menu"
          id="group-more-menu"
          role="menu"
          aria-label={t.menu}
          onTouchStart={(event) => event.stopPropagation()}
          onTouchMove={(event) => event.stopPropagation()}
          onTouchEnd={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            if (
              event.target instanceof Element &&
              event.target.closest(".auth-menu")
            )
              return;
            const buttons = Array.from(
              event.currentTarget.querySelectorAll<HTMLElement>(
                "button:not(:disabled), input:not(:disabled), a[href]",
              ),
            ).filter((element) => element.getClientRects().length > 0);
            const index = buttons.indexOf(
              document.activeElement as HTMLElement,
            );
            const next =
              event.key === "ArrowDown"
                ? (index + 1) % buttons.length
                : event.key === "ArrowUp"
                  ? (index - 1 + buttons.length) % buttons.length
                  : event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? buttons.length - 1
                      : null;
            if (next === null) return;
            event.preventDefault();
            event.stopPropagation();
            buttons[next]?.focus();
          }}
        >
          <Theme />
          {actions.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={
                id === "action:search" ? "global-search-command" : undefined
              }
              aria-expanded={id === "action:search" ? searchOpen : undefined}
              aria-controls={
                id === "action:search" ? "global-search-popup" : undefined
              }
              aria-haspopup={id === "action:search" ? "dialog" : undefined}
              onContextMenu={(event) => requestFooterPin(event, id)}
              onClick={() => {
                setOpen(false);
                onActivate(id);
              }}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
          {unpinnedItems.map((id) =>
            id === "core:account" ? (
              <div
                key={id}
                className="footer-unpinned-command footer-unpinned-account"
                onContextMenu={(event) => requestFooterPin(event, id)}
              >
                <Auth />
              </div>
            ) : (
              <button
                key={id}
                type="button"
                className="footer-unpinned-command"
                onContextMenu={(event) => requestFooterPin(event, id)}
                onClick={() => {
                  setOpen(false);
                  onActivate(id);
                }}
              >
                {id === "core:groups" ? (
                  <Layers size={18} aria-hidden="true" />
                ) : (
                  <LayoutDashboard size={18} aria-hidden="true" />
                )}
                <span>
                  {id === "core:groups" ? t.groupCategory : t.dashboard}
                </span>
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
