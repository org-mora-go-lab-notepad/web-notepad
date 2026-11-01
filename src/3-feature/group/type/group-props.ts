import type { GroupEntry } from "@/src/4-entity/notepad";

export type GroupProps = {
  groups: GroupEntry[];
  activeGroupId: string;
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  onSelect: (groupId: string) => void;
  onRemove: (groupId: string) => void;
  onRename: (groupId: string, name: string) => void;
  onTogglePinGroup: (groupId: string) => void;
  onMoveGroup: (groupId: string, targetId: string) => void;
};
