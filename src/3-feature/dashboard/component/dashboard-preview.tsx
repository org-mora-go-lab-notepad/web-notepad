import { Bookmark } from "lucide-react";

import { useI18n } from "@/src/5-shared/hook";
import { BottomSheet } from "@/src/5-shared/ui";

import type { DashboardPreviewProps } from "../type";

export function DashboardPreview({
  tab,
  groupName,
  onClose,
  returnFocusTo,
}: DashboardPreviewProps) {
  const { t } = useI18n();
  return (
    <BottomSheet
      className="dashboard-preview"
      title={tab.title}
      closeLabel={t.closeTabPreview}
      onClose={onClose}
      returnFocusTo={returnFocusTo}
    >
      {(groupName || tab.bookmarked) && (
        <div className="dashboard-preview-meta">
          {groupName && <span>{groupName}</span>}
          {tab.bookmarked && <Bookmark size={16} aria-label={t.bookmarked} />}
        </div>
      )}
      <pre className="dashboard-preview-text">{tab.content}</pre>
    </BottomSheet>
  );
}
