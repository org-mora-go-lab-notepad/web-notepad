import { ChevronDown, ChevronRight } from "lucide-react";

import type { DashboardStatusProps } from "../../type";

export function DashboardStatus({
  collapsed,
  controls,
  onToggle,
  id,
  className = "",
  status,
  label,
  count,
  tabColor,
}: DashboardStatusProps) {
  return (
    <h3
      className={className}
      id={id}
      data-status={status}
      data-tab-color={tabColor}
    >
      {onToggle ? (
        <button
          type="button"
          className="dashboard-status-toggle"
          aria-expanded={!collapsed}
          aria-controls={controls}
          onClick={onToggle}
        >
          <span className="dashboard-status-label">{label}</span>
          <span className="dashboard-count">{count}</span>
          {collapsed ? (
            <ChevronRight
              className="dashboard-status-chevron"
              size={16}
              aria-hidden="true"
            />
          ) : (
            <ChevronDown
              className="dashboard-status-chevron"
              size={16}
              aria-hidden="true"
            />
          )}
        </button>
      ) : (
        <>
          <span className="dashboard-status-label">{label}</span>
          <span className="dashboard-count">{count}</span>
        </>
      )}
    </h3>
  );
}
