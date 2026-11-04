import type { TabColor, TabStatus } from "@/src/4-entity/notepad";

export type DashboardStatusProps = {
  collapsed?: boolean;
  controls?: string;
  onToggle?: () => void;
  id?: string;
  className?: string;
  status: TabStatus;
  label: string;
  count: number;
  tabColor: TabColor;
};
