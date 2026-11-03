import type { NoteTab } from "@/src/4-entity/notepad";

export type DashboardPreviewProps = {
  tab: NoteTab;
  groupName?: string;
  returnFocusTo: HTMLElement | null;
  onClose: () => void;
};
