import { X } from "lucide-react";
import { useId, useState } from "react";

import { DASHBOARD_STATUSES, useNotepadStore } from "@/src/4-entity/notepad";
import { useI18n, useModalDialog } from "@/src/5-shared/hook";

import type { DashboardStatusEditorProps } from "../type";

export function DashboardStatusEditor({
  statusNames,
  groupName,
  onSaveStatusNames,
  onClose,
}: DashboardStatusEditorProps) {
  const { t } = useI18n();
  const defaults = useNotepadStore(
    (state) => state.settings.dashboardStatusDefaults,
  );
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useModalDialog(true, "input");
  const [draft, setDraft] = useState({ ...statusNames });
  const close = () => {
    dialogRef.current?.close();
    onClose();
  };
  const labels = {
    icebox: t.icebox,
    todo: t.statusTodo,
    ready: t.statusReady,
    "in-progress": t.statusInProgress,
    done: t.statusDone,
    closed: t.closedTitle,
  };

  return (
    <dialog
      className="dashboard-status-editor"
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSaveStatusNames(draft);
          close();
        }}
      >
        <div className="dashboard-status-editor-header">
          <h3 id={titleId}>{t.editStatus}</h3>
          <button
            type="button"
            aria-label={t.closePanel(t.editStatus)}
            onClick={close}
          >
            <X size={18} />
          </button>
        </div>
        <p id={descriptionId}>{t.groupStatusScope(groupName)}</p>
        <div className="dashboard-status-editor-fields">
          {DASHBOARD_STATUSES.map((status) => (
            <label key={status}>
              <span>{defaults[status] || labels[status]}</span>
              <input
                value={draft[status] ?? ""}
                placeholder=""
                maxLength={30}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    [status]: event.target.value,
                  }))
                }
              />
            </label>
          ))}
        </div>
        <p className="dashboard-status-editor-hint">{t.statusNameHint}</p>
        <div className="dashboard-status-editor-actions">
          <button type="button" onClick={close}>
            {t.cancel}
          </button>
          <button type="submit">{t.save}</button>
        </div>
      </form>
    </dialog>
  );
}
