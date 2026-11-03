import type { RefObject } from "react";

import type { GroupEntry, NoteTab, PaneId } from "@/src/4-entity/notepad";
import type { PaneDropZone } from "@/src/5-shared";

export type PaneViewProps = {
  pane: PaneId;
  heightRatio?: number;
  tabs: NoteTab[];
  groups: GroupEntry[];
  activeGroupId: string;
  activeTab: NoteTab | undefined;
  canCreateFromEmpty: boolean;
  editorRef: RefObject<HTMLTextAreaElement | null>;
  composingRef: RefObject<boolean>;
  isFocused: boolean;
  draggingTabId: string | null;
  draggingTabIds: string[];
  selectedTabIds: string[];
  dropZones: PaneDropZone[];
  tabSlide?: { direction: "left" | "right"; sequence: number };
  onActivate: () => void;
  onSelect: (tabId: string, extendSelection: boolean) => void;
  onClose: (tabId: string) => void;
  onMove: (tabIds: string[], toTabId: string) => void;
  onMoveToGroup: (tabId: string, groupId: string) => void;
  onAdopt: (tabId: string) => void;
  onDragStart: (tabId: string) => void;
  onDragEnd: () => void;
  onCycleTabColor: (tabId: string) => void;
  onToggleBookmark: (tabId: string) => void;
  onAdd: () => void;
  onChange: (content: string) => void;
};
