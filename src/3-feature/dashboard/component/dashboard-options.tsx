import {
  Check,
  CircleCheck,
  EllipsisVertical,
  Pencil,
  Plus,
  StickyNote,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useNotepadStore } from "@/src/4-entity/notepad";
import { useI18n } from "@/src/5-shared/hook";

import type { DashboardOptionsProps } from "../type";
import { DashboardStatusEditor } from "./dashboard-status-editor";

export function DashboardOptions({
  groupName,
  onAddTab,
  statusNames,
  onSaveStatusNames,
  iceboxVisible,
  doneVisible,
  onToggleIcebox,
  onToggleDone,
}: DashboardOptionsProps) {
  const { t } = useI18n();
  const defaults = useNotepadStore(
    (state) => state.settings.dashboardStatusDefaults,
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.isComposing) return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    };
    window.addEventListener("pointerdown", onPointerDown);
    // Handle the floating menu before the dashboard's Escape shortcut.
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  return (
    <div className="dashboard-options" ref={rootRef}>
      <button
        className="side-panel-action dashboard-options-trigger"
        ref={triggerRef}
        type="button"
        aria-label={t.dashboardOptions}
        title={t.dashboardOptions}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="dashboard-options-menu"
        onClick={() => setOpen((current) => !current)}
      >
        <EllipsisVertical />
      </button>
      {open && (
        <div
          className="dashboard-options-menu"
          id="dashboard-options-menu"
          role="dialog"
          aria-label={t.dashboardOptions}
        >
          {onAddTab && (
            <button
              className="dashboard-add-tab"
              type="button"
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus({ preventScroll: true });
                onAddTab();
              }}
            >
              <Plus size={18} aria-hidden="true" />
              <span>{t.addTab}</span>
            </button>
          )}
          <button
            className="dashboard-icebox-command"
            type="button"
            aria-pressed={iceboxVisible}
            onClick={onToggleIcebox}
          >
            <StickyNote size={18} strokeWidth={1.8} />
            <span>{statusNames.icebox ?? defaults.icebox ?? t.icebox}</span>
            {iceboxVisible && (
              <Check className="dashboard-option-check" size={16} />
            )}
          </button>
          <button
            className="dashboard-done-command"
            type="button"
            aria-pressed={doneVisible}
            onClick={onToggleDone}
          >
            <CircleCheck size={18} strokeWidth={1.8} />
            <span>{statusNames.done ?? defaults.done ?? t.statusDone}</span>
            {doneVisible && (
              <Check className="dashboard-option-check" size={16} />
            )}
          </button>
          <button
            className="dashboard-edit-status-command"
            type="button"
            onClick={() => {
              setOpen(false);
              setEditing(true);
            }}
          >
            <Pencil size={18} />
            <span>{t.editStatus}</span>
          </button>
        </div>
      )}
      {editing && (
        <DashboardStatusEditor
          statusNames={statusNames}
          groupName={groupName}
          onSaveStatusNames={onSaveStatusNames}
          onClose={() => {
            setEditing(false);
            triggerRef.current?.focus();
          }}
        />
      )}
    </div>
  );
}
