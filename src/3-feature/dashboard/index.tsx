"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  ALL_SHARED_GROUP_ID,
  compareGroups,
  getActiveGroup,
  getDashboardColumns,
  getTabStatus,
  isSharedGroupId,
  UNGROUPED_GROUP_ID,
  useNotepadStore,
} from "@/src/4-entity/notepad";
import { createSharedTabLink } from "@/src/4-entity/notepad/util";
import { useI18n } from "@/src/5-shared/hook";
import { SidePanel, TabContextMenu } from "@/src/5-shared/ui";

import {
  DashboardColumn,
  DashboardOptions,
  DashboardPreview,
  DashboardStatuses,
} from "./component";
import {
  useDashboardDrag,
  useDashboardMobileLayout,
  useDashboardScroll,
} from "./hook";
import type { DashboardProps } from "./type";

export function Dashboard({
  renderTabEditor,
  groupId,
  groupName,
  statusNames,
  onSaveStatusNames,
  visibility,
  onVisibilityChange,
  tabs,
  activeTabId,
  groups,
  showGroupNames,
  tabColorCycle,
  open,
  onClose,
  onOpenTab,
  onMoveCard,
  onMoveToGroup,
  onToggleTabBookmark,
  onDeleteTab,
}: DashboardProps) {
  const [expanded, setExpanded] = useState(false);
  const mobileLayout = useDashboardMobileLayout();
  const [preview, setPreview] = useState<{
    id: string;
    trigger: HTMLElement | null;
  } | null>(null);
  const previewId = preview?.id;
  const iceboxVisible = visibility.icebox;
  const doneVisible = visibility.done !== false;
  const [contextMenu, setContextMenu] = useState<{
    itemId: string;
    left: number;
    top: number;
  } | null>(null);
  const [linkFeedback, setLinkFeedback] = useState<"copied" | "error" | null>(
    null,
  );
  const { t } = useI18n();
  const defaults = useNotepadStore(
    (state) => state.settings.dashboardStatusDefaults,
  );
  const displayStatusNames = { ...defaults, ...statusNames };
  const { contentRef, listRef, boardRef, scrollToCard } = useDashboardScroll(
    open,
    activeTabId,
    mobileLayout,
  );
  const openCard = (tabId: string) => {
    if (drag.isRecentDrag()) return;
    if (mobileLayout) {
      onOpenTab(tabId);
      setContextMenu(null);
      setPreview({
        id: tabId,
        trigger: document.querySelector<HTMLElement>(
          `.dashboard-card[data-tab-id="${CSS.escape(tabId)}"] .dashboard-card-open`,
        ),
      });
      return;
    }
    onOpenTab(tabId);
    requestAnimationFrame(() => scrollToCard(tabId));
  };
  const columns = getDashboardColumns(tabs, tabColorCycle).filter(
    (column) => column.status !== "done" || doneVisible,
  );
  const iceboxTabs = tabs.filter(
    (tab) =>
      tab.content.trim() && getTabStatus(tab, tabColorCycle) === "icebox",
  );
  const visibleColumns = [
    ...(iceboxVisible ? [{ status: "icebox" as const, tabs: iceboxTabs }] : []),
    ...columns,
  ];
  const visibleTabs = [
    ...columns.flatMap((column) => column.tabs),
    ...(iceboxVisible ? iceboxTabs : []),
  ];
  const previewTab =
    open && mobileLayout ? tabs.find((tab) => tab.id === previewId) : undefined;
  const contextTab = visibleTabs.find((tab) => tab.id === contextMenu?.itemId);
  const contextGroup = groups.find((group) =>
    group.tabs.some((tab) => tab.id === contextMenu?.itemId),
  );
  const drag = useDashboardDrag({ visibleTabs, onMoveCard });

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener("popstate", closeMenu);
    return () => window.removeEventListener("popstate", closeMenu);
  }, []);

  useEffect(() => {
    if (!linkFeedback) return;
    const timeout = window.setTimeout(() => setLinkFeedback(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [linkFeedback]);

  useEffect(() => {
    if (!open) return;
    return () => setContextMenu(null);
  }, [open]);

  useEffect(() => {
    if (!open || !mobileLayout) return;
    return () => setPreview(null);
  }, [open, mobileLayout, groupId]);

  const copyTabLink = async (sharedGroupId: string, tabId: string) => {
    try {
      const group = groups.find((item) => item.id === sharedGroupId);
      if (!group) throw new Error("Shared group unavailable");
      await navigator.clipboard.writeText(
        await createSharedTabLink(group, tabId),
      );
      setLinkFeedback("copied");
    } catch {
      setLinkFeedback("error");
    }
  };

  return (
    <SidePanel
      className="dashboard"
      id="dashboard-panel"
      title={mobileLayout ? groupName : t.dashboardTitle}
      open={open}
      expanded={open && expanded}
      headerActions={
        <>
          {open && (
            <DashboardOptions
              key={groupId}
              onAddTab={
                mobileLayout && groupId !== ALL_SHARED_GROUP_ID
                  ? () => {
                      const blank = tabs.find(
                        (tab) => tab.open && !tab.content.trim(),
                      );
                      if (blank) {
                        openCard(blank.id);
                        return;
                      }
                      useNotepadStore.getState().addTab();
                      const id = getActiveGroup(
                        useNotepadStore.getState(),
                      )?.activeTabId;
                      if (id) openCard(id);
                    }
                  : undefined
              }
              groupId={groupId}
              groupName={
                showGroupNames
                  ? t.allGroup
                  : (groups.find((group) => group.id === groupId)?.name ??
                    t.ungrouped)
              }
              statusNames={statusNames}
              onSaveStatusNames={onSaveStatusNames}
              iceboxVisible={iceboxVisible}
              doneVisible={doneVisible}
              onToggleIcebox={() =>
                onVisibilityChange({ ...visibility, icebox: !iceboxVisible })
              }
              onToggleDone={() =>
                onVisibilityChange({ ...visibility, done: !doneVisible })
              }
            />
          )}
          <button
            className="side-panel-action dashboard-expand"
            type="button"
            onClick={() => setExpanded((current) => !current)}
            aria-pressed={expanded}
            aria-label={expanded ? t.collapseDashboard : t.expandDashboard}
            title={expanded ? t.collapseDashboard : t.expandDashboard}
          >
            {expanded ? <Minimize2 /> : <Maximize2 />}
          </button>
        </>
      }
      closeLabel={t.closePanel(t.dashboardTitle)}
      ariaLabel={t.dashboardTitle}
      onClose={() => {
        setContextMenu(null);
        onClose();
      }}
    >
      <div className="dashboard-content" ref={contentRef}>
        <DashboardStatuses
          statusNames={displayStatusNames}
          columns={columns}
          tabColorCycle={tabColorCycle}
          iceboxVisible={iceboxVisible}
          iceboxCount={iceboxTabs.length}
        />
        <div className="dashboard-list" ref={listRef}>
          <div
            className={`dashboard-board ${iceboxVisible ? "has-icebox" : ""} ${doneVisible ? "has-done" : ""}`}
            ref={boardRef}
          >
            {visibleColumns.map((column) => (
              <DashboardColumn
                key={`${groupId}:${column.status}`}
                groupId={groupId}
                statusNames={displayStatusNames}
                column={column}
                drag={drag}
                activeTabId={previewId ?? activeTabId}
                groups={groups}
                showGroupNames={showGroupNames}
                tabColorCycle={tabColorCycle}
                contextMenuTabId={contextMenu?.itemId}
                onOpenTab={openCard}
                onOpenContextMenu={(itemId, left, top) =>
                  setContextMenu({ itemId, left, top })
                }
              />
            ))}
          </div>
        </div>
      </div>
      {previewTab && (
        <DashboardPreview
          tab={previewTab}
          returnFocusTo={preview?.trigger ?? null}
          editor={renderTabEditor(previewTab)}
          onClose={() => setPreview(null)}
        />
      )}
      {contextMenu && contextTab && (
        <TabContextMenu
          left={contextMenu.left}
          top={contextMenu.top}
          bookmarked={contextTab.bookmarked}
          targetGroups={groups
            .filter(
              (group) =>
                group.id !== contextGroup?.id &&
                group.id !== UNGROUPED_GROUP_ID,
            )
            .sort(compareGroups)}
          onMoveToGroup={(groupId) => {
            onMoveToGroup(contextTab.id, groupId);
            setContextMenu(null);
          }}
          onToggleBookmark={() => {
            onToggleTabBookmark(contextTab.id);
            setContextMenu(null);
          }}
          onCopyLink={
            contextGroup && isSharedGroupId(contextGroup.id)
              ? () => {
                  setContextMenu(null);
                  void copyTabLink(contextGroup.id, contextTab.id);
                }
              : undefined
          }
          onDeleteTab={() => {
            onDeleteTab(contextTab.id);
            setContextMenu(null);
          }}
          onClose={() => setContextMenu(null)}
        />
      )}
      {linkFeedback && (
        <span className="tab-link-feedback" role="status">
          {linkFeedback === "copied" ? t.tabLinkCopied : t.tabLinkCopyError}
        </span>
      )}
    </SidePanel>
  );
}
