"use client";

import { useEffect, useState } from "react";

import {
  Bookmark,
  Dashboard,
  GlobalSearch,
  Group,
  Setting,
  Shortcut,
  UserGuide,
} from "@/src/3-feature";
import { isAggregateGroupId } from "@/src/4-entity/notepad";

import type { PanelProps } from "./type";

export function Panel({
  openPanel,
  backgroundPanel,
  activeGroupTabs,
  activeTabId,
  tabColorCycle,
  groups,
  activeGroupId,
  activeGroupName,
  groupMenuOpen,
  globalSearchQuery,
  onClose,
  onCloseGroupMenu,
  onGlobalSearchQueryChange,
  onOpenBookmark,
  onRemoveBookmark,
  renderTabEditor,
  onOpenDashboardTab,
  onMoveDashboardCard,
  onSaveDashboardStatusNames,
  dashboardVisibility,
  dashboardStatusNames,
  onDashboardVisibilityChange,
  onMoveDashboardTabToGroup,
  onToggleDashboardTabBookmark,
  onDeleteDashboardTab,
  onCreateGroup,
  onSelectGroup,
  onSelectSearchTab,
  onRemoveGroup,
  onRenameGroup,
  onToggleGroupPin,
  onMoveGroup,
  onOpenShortcuts,
}: PanelProps) {
  const [guideOpen, setGuideOpen] = useState(false);
  useEffect(() => {
    const openGuide = () => setGuideOpen(true);
    window.addEventListener("notepad-open-guide", openGuide);
    return () => window.removeEventListener("notepad-open-guide", openGuide);
  }, []);
  return (
    <div className="panel">
      <Bookmark
        groups={groups}
        open={openPanel === "bookmarks" || backgroundPanel === "bookmarks"}
        onClose={onClose}
        onOpen={onOpenBookmark}
        onRemove={onRemoveBookmark}
      />
      <Dashboard
        renderTabEditor={renderTabEditor}
        groupId={activeGroupId}
        groupName={activeGroupName}
        statusNames={dashboardStatusNames}
        onSaveStatusNames={onSaveDashboardStatusNames}
        visibility={dashboardVisibility}
        onVisibilityChange={onDashboardVisibilityChange}
        tabs={activeGroupTabs}
        activeTabId={activeTabId}
        groups={groups}
        showGroupNames={isAggregateGroupId(activeGroupId)}
        tabColorCycle={tabColorCycle}
        open={openPanel === "dashboard" || backgroundPanel === "dashboard"}
        onClose={onClose}
        onOpenTab={onOpenDashboardTab}
        onMoveCard={onMoveDashboardCard}
        onMoveToGroup={onMoveDashboardTabToGroup}
        onToggleTabBookmark={onToggleDashboardTabBookmark}
        onDeleteTab={onDeleteDashboardTab}
      />
      <Group
        groups={groups}
        activeGroupId={activeGroupId}
        open={groupMenuOpen}
        onClose={onCloseGroupMenu}
        onCreate={onCreateGroup}
        onSelect={onSelectGroup}
        onRemove={onRemoveGroup}
        onRename={onRenameGroup}
        onTogglePinGroup={onToggleGroupPin}
        onMoveGroup={onMoveGroup}
      />
      <GlobalSearch
        groups={groups}
        searchQuery={globalSearchQuery}
        onSearchQueryChange={onGlobalSearchQueryChange}
        open={openPanel === "global-search"}
        onClose={onClose}
        onSelectTab={onSelectSearchTab}
      />
      {guideOpen && (
        <UserGuide
          onClose={() => setGuideOpen(false)}
          onOpenShortcuts={() => {
            setGuideOpen(false);
            onOpenShortcuts();
          }}
        />
      )}
      <Shortcut
        open={openPanel === "shortcuts" || backgroundPanel === "shortcuts"}
        onClose={onClose}
      />
      <Setting
        open={openPanel === "settings" || backgroundPanel === "settings"}
        onClose={onClose}
      />
    </div>
  );
}
