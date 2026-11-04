import type { DashboardColumnData } from "@/src/4-entity/notepad";

import type { useDashboardDrag } from "../../hook";
import type { DashboardProps } from "..";

export type DashboardColumnProps = Pick<
  DashboardProps,
  | "groupId"
  | "activeTabId"
  | "groups"
  | "showGroupNames"
  | "tabColorCycle"
  | "statusNames"
  | "onOpenTab"
> & {
  column: DashboardColumnData;
  drag: ReturnType<typeof useDashboardDrag>;
  contextMenuTabId?: string;
  onOpenContextMenu: (itemId: string, clientX: number, clientY: number) => void;
};
