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
          <span aria-hidden="true">{collapsed ? "▸" : "▾"}</span>
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
