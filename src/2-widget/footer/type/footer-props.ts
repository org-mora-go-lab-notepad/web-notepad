import type { GroupEntry } from "@/src/4-entity/notepad";

export type FooterProps = {
  // A group was created or changed today.
  hasGroupUpdateToday: boolean;
  dashboardOpen: boolean;
  activeGroupName: string;
  groupsOpen: boolean;
  searchOpen?: boolean;
  groups?: GroupEntry[];
  onSwipeTabs?: (direction: "left" | "right") => boolean | void;
  onToggleDashboard: () => void;
  onToggleGroups: () => void;
  onSelectGroup?: (groupId: string) => void;
  onOpenGuide?: () => void;
  onOpenSettings?: () => void;
  onToggleBookmarks?: () => void;
  onToggleSearch?: () => void;
};
