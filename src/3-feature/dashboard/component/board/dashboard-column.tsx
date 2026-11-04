import { useId, useState } from "react";

import { compareDashboardCards, getStatusColor } from "@/src/4-entity/notepad";
import { useI18n } from "@/src/5-shared/hook";

import { useDashboardMobileLayout } from "../../hook";
import type { DashboardColumnProps } from "../../type";
import { DashboardCard } from "./dashboard-card";
import { DashboardStatus } from "./dashboard-status";

export function DashboardColumn({
  column,
  drag,
  activeTabId,
  groups,
  showGroupNames,
  tabColorCycle,
  statusNames,
  contextMenuTabId,
  onOpenTab,
  onOpenContextMenu,
}: DashboardColumnProps) {
  const { status, tabs: columnTabs } = column;
  const mobile = useDashboardMobileLayout();
  const [collapsed, setCollapsed] = useState(false);
  const cardsId = useId();
  const { t } = useI18n();
  const statusLabel = {
    icebox: t.icebox,
    todo: t.statusTodo,
    ready: t.statusReady,
    "in-progress": t.statusInProgress,
    done: t.statusDone,
    closed: t.closedTitle,
  }[status];
  const cardEntries = [...columnTabs].sort(compareDashboardCards);
  return (
    <section
      key={status}
      className={`dashboard-column dashboard-${status}-column ${columnTabs.length === 0 ? "is-empty" : ""} ${drag.overStatus === status ? "is-drop-target" : ""}`}
      data-status={status}
      aria-label={statusLabel}
      data-tab-color={getStatusColor(status, tabColorCycle)}
      onDragOver={(event) => {
        if (!drag.draggingTabId) return;
        event.preventDefault();
        drag.setOverStatus(status);
        drag.setCardTarget(null);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          drag.setOverStatus((current) =>
            current === status ? null : current,
          );
        }
      }}
      onDrop={(event) => drag.drop(status, event)}
    >
      <DashboardStatus
        className="dashboard-column-status"
        collapsed={mobile ? collapsed : undefined}
        onToggle={mobile ? () => setCollapsed(!collapsed) : undefined}
        controls={cardsId}
        status={status}
        label={statusNames[status] ?? statusLabel}
        count={columnTabs.length}
        tabColor={getStatusColor(status, tabColorCycle)}
      />
      <div
        id={cardsId}
        className="dashboard-cards"
        hidden={mobile && collapsed}
      >
        {columnTabs.length === 0 && (
          <div className="dashboard-empty">
            <p>{t.dashboardEmpty}</p>
          </div>
        )}
        {cardEntries.map((tab) => (
          <DashboardCard
            key={tab.id}
            tab={
              tab.dashboardStatus === "closed"
                ? {
                    ...tab,
                    tabColor: getStatusColor("done", tabColorCycle),
                    dashboardStatus: "done",
                  }
                : tab
            }
            active={tab.id === activeTabId}
            contextMenuTarget={tab.id === contextMenuTabId}
            groupName={
              showGroupNames
                ? groups.find((group) =>
                    group.tabs.some((item) => item.id === tab.id),
                  )?.name
                : undefined
            }
            dragging={drag.draggingTabId === tab.id}
            onOpen={onOpenTab}
            onOpenContextMenu={(tabId, left, top) =>
              onOpenContextMenu(tabId, left, top)
            }
            onDragStart={drag.startDrag}
            onDragEnd={drag.endDrag}
            onTouchDragStart={drag.startTouchDrag}
            onTouchDragOver={drag.touchOver}
            dropPlacement={
              drag.overCard?.id === tab.id && drag.draggingTabId !== tab.id
                ? drag.overCard.placement
                : undefined
            }
            onCardDragOver={(event) => {
              if (!drag.draggingTabId || drag.draggingTabId === tab.id) return;
              event.preventDefault();
              event.stopPropagation();
              drag.setOverStatus(status);
              const bounds = event.currentTarget.getBoundingClientRect();
              drag.setCardTarget({
                id: tab.id,
                placement:
                  event.clientY > bounds.top + bounds.height / 2
                    ? "after"
                    : "before",
              });
            }}
            onCardDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              const bounds = event.currentTarget.getBoundingClientRect();
              drag.drop(status, event, {
                id: tab.id,
                placement:
                  event.clientY > bounds.top + bounds.height / 2
                    ? "after"
                    : "before",
              });
            }}
            onTouchDrop={drag.touchDrop}
          />
        ))}
      </div>
    </section>
  );
}
