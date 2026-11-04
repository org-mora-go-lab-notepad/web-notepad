import type { ReactNode } from "react";

import type { NoteTab } from "@/src/4-entity/notepad";

export type DashboardPreviewProps = {
  tab: NoteTab;
  editor: ReactNode;
  returnFocusTo: HTMLElement | null;
  onClose: () => void;
};
