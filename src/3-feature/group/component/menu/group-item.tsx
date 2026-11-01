"use client";

import {
  Check,
  EllipsisVertical,
  LogOut,
  Pencil,
  Pin,
  Share2,
  Trash2,
  X,
  XSquare,
} from "lucide-react";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { useNotepadStore } from "@/src/4-entity/notepad";
import { useI18n } from "@/src/5-shared/hook";

import type { GroupItemProps } from "../../type";

// One group row: click the name to switch; open its menu for actions.
export function GroupItem({
  groupId,
  shared = false,
  hideActionsButton,
  sharingRole,
  sharingActive = true,
  onChangeSharing,
  dragging,
  dropTarget,
  onReorderStart,
  onReorderKey,
  name,
  active,
  pinned,
  editable,
  muted,
  system = false,
  actionsOpen,
  onToggleActions,
  onSelect,
  onRename,
  onCloseTabs,
  onDelete,
  onShare,
}: GroupItemProps) {
  const { t } = useI18n();
  const footerItems = useNotepadStore((state) => state.settings.footerItems);
  const setFooterItems = useNotepadStore((state) => state.setFooterItems);
  const [contextActions, setContextActions] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuAnchorRef = useRef<HTMLElement | null>(null);
  const cancelLongPressRef = useRef<(() => void) | null>(null);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });
  const positionActions = useCallback((anchor: HTMLElement) => {
    menuAnchorRef.current = anchor;
    const rect = anchor.getBoundingClientRect();
    const rowHeight = window.matchMedia("(max-width: 512px)").matches ? 44 : 40;
    const menuHeight =
      dropdownRef.current?.getBoundingClientRect().height ?? 4 * rowHeight + 12;
    const menuWidth = dropdownRef.current?.getBoundingClientRect().width ?? 216;
    const below = rect.bottom + 8;
    setMenuPosition({
      left: Math.max(
        8,
        Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8),
      ),
      top:
        below + menuHeight <= window.innerHeight - 8
          ? below
          : Math.max(8, rect.top - menuHeight - 8),
    });
  }, []);

  useLayoutEffect(() => {
    if (actionsOpen && menuAnchorRef.current)
      positionActions(menuAnchorRef.current);
  }, [actionsOpen, contextActions, positionActions]);

  const clearLongPress = useCallback(() => {
    cancelLongPressRef.current?.();
    cancelLongPressRef.current = null;
  }, []);

  useEffect(() => () => clearLongPress(), [clearLongPress]);

  useEffect(() => {
    if (!actionsOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!actionsRef.current?.contains(event.target as Node))
        onToggleActions();
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onToggleActions();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape, true);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape, true);
    };
  }, [actionsOpen, onToggleActions]);

  const handleRename = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = (editingName ?? "").trim();
    if (!trimmedName) return;
    onRename(trimmedName);
    setEditingName(null);
  };

  if (editingName !== null) {
    return (
      <article className={`group-item ${active ? "is-active" : ""}`}>
        <form className="group-edit-form" onSubmit={handleRename}>
          <input
            type="text"
            value={editingName}
            onChange={(event) => setEditingName(event.target.value)}
            aria-label={t.editGroupName(name)}
            maxLength={60}
            autoFocus
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                setEditingName(null);
              }
            }}
          />
          <button
            type="submit"
            aria-label={t.saveGroupEdit}
            title={t.save}
            disabled={!editingName.trim()}
          >
            <Check size={14} />
          </button>
          <button
            type="button"
            aria-label={t.cancelGroupEdit}
            title={t.cancel}
            onClick={() => setEditingName(null)}
          >
            <X size={14} />
          </button>
        </form>
      </article>
    );
  }

  return (
    <article
      data-group-id={groupId}
      data-pinned={pinned}
      className={`${system ? "group-system-item" : "group-item"} ${active ? "is-active" : ""} ${dragging ? "is-dragging" : ""} ${dropTarget ? "is-drop-target" : ""}`}
      onPointerDown={(event) => {
        if (!editable || event.button !== 0) return;
        const target = event.target as Element;
        if (target.closest(".group-actions, .group-reorder")) return;
        onReorderStart(event);
      }}
    >
      <button
        className="group-reorder"
        type="button"
        aria-label={t.reorderGroup(name)}
        title={t.reorderGroup(name)}
        onKeyDown={(event) => {
          if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
          event.preventDefault();
          onReorderKey(event.key === "ArrowUp" ? -1 : 1);
        }}
      ></button>
      <button
        className="group-select"
        type="button"
        aria-pressed={active}
        title={name}
        onPointerDown={(event) => {
          if (!hideActionsButton || event.pointerType !== "touch") return;
          clearLongPress();
          const anchor = event.currentTarget;
          const row = anchor.closest<HTMLElement>("[data-group-id]");
          const { pointerId, clientX, clientY } = event;
          const cancelOnMove = (moveEvent: globalThis.PointerEvent) => {
            if (
              moveEvent.pointerId === pointerId &&
              Math.hypot(
                moveEvent.clientX - clientX,
                moveEvent.clientY - clientY,
              ) >= 6
            )
              clearLongPress();
          };
          const cancelOnEnd = (endEvent: globalThis.PointerEvent) => {
            if (endEvent.pointerId === pointerId) clearLongPress();
          };
          const timer = setTimeout(() => {
            clearLongPress();
            setContextActions(false);
            if (row) row.dataset.reorderDragged = "true";
            positionActions(anchor);
            if (!actionsOpen) onToggleActions();
          }, 500);
          window.addEventListener("pointermove", cancelOnMove);
          window.addEventListener("pointerup", cancelOnEnd);
          window.addEventListener("pointercancel", cancelOnEnd);
          cancelLongPressRef.current = () => {
            clearTimeout(timer);
            window.removeEventListener("pointermove", cancelOnMove);
            window.removeEventListener("pointerup", cancelOnEnd);
            window.removeEventListener("pointercancel", cancelOnEnd);
          };
        }}
        onClick={(event) => {
          const row =
            event.currentTarget.closest<HTMLElement>("[data-group-id]");
          if (row?.dataset.reorderDragged === "true") {
            delete row.dataset.reorderDragged;
            return;
          }
          onSelect();
        }}
        onContextMenu={(event) => {
          if (
            !hideActionsButton &&
            window.matchMedia("(max-width: 512px)").matches
          )
            return;
          event.preventDefault();
          event.stopPropagation();
          setContextActions(!window.matchMedia("(max-width: 512px)").matches);
          clearLongPress();
          const row =
            event.currentTarget.closest<HTMLElement>("[data-group-id]");
          if (row?.dataset.reorderDragged === "true") return;
          if (
            hideActionsButton &&
            window.matchMedia("(max-width: 512px)").matches &&
            row
          )
            row.dataset.reorderDragged = "true";
          positionActions(event.currentTarget);
          if (!actionsOpen) onToggleActions();
        }}
      >
        <strong className={muted ? "is-ungrouped" : ""}>{name}</strong>
      </button>
      {editable && (
        <div className="group-actions" ref={actionsRef}>
          {!hideActionsButton && (
            <button
              type="button"
              aria-label={t.groupActionsFor(name)}
              aria-expanded={actionsOpen}
              aria-controls={`group-actions-${groupId}`}
              title={t.groupActions}
              onClick={(event) => {
                setContextActions(false);
                positionActions(event.currentTarget);
                onToggleActions();
              }}
            >
              <EllipsisVertical size={14} />
            </button>
          )}
          {actionsOpen && (
            <div
              ref={dropdownRef}
              className="group-action-dropdown"
              role={contextActions ? "menu" : undefined}
              id={`group-actions-${groupId}`}
              style={{ left: menuPosition.left, top: menuPosition.top }}
            >
              {editable && (
                <>
                  {!contextActions && (
                    <button
                      type="button"
                      role={contextActions ? "menuitem" : undefined}
                      onClick={() => {
                        onCloseTabs();
                        onToggleActions();
                      }}
                    >
                      <XSquare size={16} />
                      <span>{t.closeGroupTabs}</span>
                    </button>
                  )}
                  {contextActions && (
                    <button
                      type="button"
                      role="menuitem"
                      disabled={footerItems.includes(`group:${groupId}`)}
                      onClick={() => {
                        setFooterItems([...footerItems, `group:${groupId}`]);
                        onToggleActions();
                      }}
                    >
                      <Pin size={16} />
                      <span>{t.pinToFooter}</span>
                    </button>
                  )}
                  {!contextActions &&
                    (!shared ||
                      (sharingRole === "owner" && !sharingActive)) && (
                      <button
                        type="button"
                        aria-label={t.shareGroupFor(name)}
                        onClick={() => {
                          onToggleActions();
                          onShare();
                        }}
                      >
                        <Share2 size={16} />
                        <span>{t.shareGroup}</span>
                      </button>
                    )}
                  {!contextActions && (
                    <button
                      type="button"
                      aria-label={t.editGroupFor(name)}
                      role={contextActions ? "menuitem" : undefined}
                      title={t.edit}
                      onClick={() => {
                        onToggleActions();
                        setEditingName(name);
                      }}
                    >
                      <Pencil size={16} />
                      <span>{t.edit}</span>
                    </button>
                  )}
                  {!contextActions && !shared && (
                    <button
                      type="button"
                      aria-label={t.deleteGroupFor(name)}
                      title={t.delete}
                      onClick={(event) =>
                        onDelete(
                          actionsRef.current?.querySelector("button") ??
                            event.currentTarget,
                        )
                      }
                    >
                      <Trash2 size={16} />
                      <span>{t.delete}</span>
                    </button>
                  )}
                  {!contextActions && shared && sharingRole === "member" && (
                    <button
                      type="button"
                      onClick={(event) => {
                        const anchor =
                          actionsRef.current?.querySelector<HTMLButtonElement>(
                            "button",
                          ) ?? event.currentTarget;
                        onToggleActions();
                        onChangeSharing?.("leave", anchor);
                      }}
                    >
                      <LogOut size={16} />
                      <span>{t.leaveGroup}</span>
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
