import {
  Bookmark,
  BookOpen,
  EllipsisVertical,
  Search,
  Settings,
} from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Theme } from "@/src/3-feature";
import { useI18n } from "@/src/5-shared/hook";
import { requestFooterPin } from "@/src/5-shared/util";

import type { MoreMenuProps } from "../type";

const subscribeToClient = () => () => undefined;

export function MoreMenu({ searchOpen, onActivate }: MoreMenuProps) {
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
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || document.querySelector(".footer-pin-menu"))
        return;
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
    { id: "guide", label: t.guide, Icon: BookOpen },
    { id: "search", label: t.search, Icon: Search },
    { id: "bookmarks", label: t.bookmark, Icon: Bookmark },
    { id: "settings", label: t.settings, Icon: Settings },
  ];
  return (
    <div className="footer-more" ref={container}>
      <button
        ref={trigger}
        type="button"
        className="more-command"
        disabled={!ready}
        aria-label={t.more}
        title={t.more}
        aria-expanded={open}
        aria-controls="group-more-menu"
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <EllipsisVertical size={24} aria-hidden="true" />
        <span className="more-command-label">{t.more}</span>
      </button>
      {open && (
        <div
          className="group-more-menu"
          id="group-more-menu"
          role="menu"
          aria-label={t.more}
          onTouchStart={(event) => event.stopPropagation()}
          onTouchMove={(event) => event.stopPropagation()}
          onTouchEnd={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            const buttons = Array.from(
              event.currentTarget.querySelectorAll<HTMLElement>(
                "button, input",
              ),
            );
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
          {actions.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={id === "search" ? "global-search-command" : undefined}
              aria-expanded={id === "search" ? searchOpen : undefined}
              aria-controls={
                id === "search" ? "global-search-popup" : undefined
              }
              aria-haspopup={id === "search" ? "dialog" : undefined}
              onContextMenu={(event) => requestFooterPin(event, `action:${id}`)}
              onClick={() => {
                setOpen(false);
                onActivate(`action:${id}`);
              }}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
          <Theme />
        </div>
      )}
    </div>
  );
}
