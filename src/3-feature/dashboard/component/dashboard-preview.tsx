import { useI18n } from "@/src/5-shared/hook";
import { BottomSheet } from "@/src/5-shared/ui";

import type { DashboardPreviewProps } from "../type";

export function DashboardPreview({
  tab,
  editor,
  onClose,
  returnFocusTo,
}: DashboardPreviewProps) {
  const { t } = useI18n();
  return (
    <BottomSheet
      className="dashboard-preview"
      title={tab.title}
      closeLabel={t.closeTabPreview}
      resizeLabel={t.editorHeight}
      onClose={onClose}
      returnFocusTo={returnFocusTo}
    >
      {editor}
    </BottomSheet>
  );
}
