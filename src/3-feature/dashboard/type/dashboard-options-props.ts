import type { DashboardProps } from "./dashboard-props";

export type DashboardOptionsProps = Pick<
  DashboardProps,
  "groupId" | "statusNames" | "onSaveStatusNames"
> & {
  groupName: string;
  onAddTab?: () => void;
  iceboxVisible: boolean;
  doneVisible: boolean;
  onToggleIcebox: () => void;
  onToggleDone: () => void;
};
