"use client";

import { useCallback, useEffect, useState } from "react";

import {
  ALL_GROUP_ID,
  ALL_MY_GROUP_ID,
  ALL_SHARED_GROUP_ID,
  DEFAULT_DASHBOARD_VISIBILITY,
  getActiveGroup,
  getBottomPane,
  getPaneWorkspace,
  type PaneColumn,
  type PaneId,
  UNGROUPED_GROUP_ID,
  useNotepadHydrated,
  useNotepadStore,
} from "@/src/4-entity/notepad";
import { HOME_RETURN_FOCUS_KEY, MESSAGES } from "@/src/5-shared/constant";
import { isToday } from "@/src/5-shared/util";

import type { PaneColumnProps, PaneViewProps } from "../type";
import { useHomeNavigation } from "./navigation";
import { useNotepadShortcuts } from "./shortcut";
import {
  useEditorFocus,
  useHomeTabActions,
  usePaneDrag,
  usePaneRefs,
} from "./workspace";

const COLUMNS: PaneColumn[] = ["left", "right"];

export function useHome() {
  const hydrated = useNotepadHydrated();
  const [mobileTabSlide, setMobileTabSlide] = useState<{
    pane: PaneId;
    direction: "left" | "right";
    sequence: number;
  } | null>(null);
  const [suppressInitialEditorFocus] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      if (sessionStorage.getItem(HOME_RETURN_FOCUS_KEY) === "1") return true;
      const navigation = performance.getEntriesByType("navigation")[0] as
        PerformanceNavigationTiming | undefined;
      if (navigation?.type === "back_forward") return true;
      const referrer = new URL(document.referrer);
      return (
        referrer.origin === window.location.origin &&
        (referrer.pathname === "/board" || referrer.pathname === "/my-page")
      );
    } catch {
      return false;
    }
  });
  useEffect(() => {
    // Only the Home instance that consumed the return marker may clear it.
    // An outgoing Home can finish this effect after My Page has already set
    // the marker, which otherwise makes history focus suppression race-prone.
    if (!suppressInitialEditorFocus) return;
    try {
      sessionStorage.removeItem(HOME_RETURN_FOCUS_KEY);
    } catch {
      /* Keep the editor usable if session storage is unavailable. */
    }
  }, [suppressInitialEditorFocus]);
  const editorRefs = usePaneRefs<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const clearRestoredPageFocus = () => {
      try {
        if (sessionStorage.getItem(HOME_RETURN_FOCUS_KEY) !== "1") return;
        sessionStorage.removeItem(HOME_RETURN_FOCUS_KEY);
      } catch {
        return;
      }
      for (const editor of Object.values(editorRefs)) {
        if (document.activeElement === editor.current) editor.current?.blur();
      }
    };
    const clearFocusBeforePageCache = () => {
      for (const editor of Object.values(editorRefs)) {
        if (document.activeElement === editor.current) editor.current?.blur();
      }
    };
    window.addEventListener("pageshow", clearRestoredPageFocus);
    window.addEventListener("pagehide", clearFocusBeforePageCache);
    return () => {
      window.removeEventListener("pageshow", clearRestoredPageFocus);
      window.removeEventListener("pagehide", clearFocusBeforePageCache);
    };
  }, [editorRefs]);
  const composingRefs = usePaneRefs(false);
  const store = useNotepadStore();
  const {
    groups,
    activeGroupId,
    closedTabs,
    updateTab,
    moveTab,
    moveTabs,
    setSplitRatio,
    setRowRatio,
    cycleTabColor,
    toggleBookmark,
    moveDashboardTab,
    deleteTab,
    removeClosedTab,
    removeBookmark,
    createGroup,
    renameGroup,
    setGroupStatusNames,
    setGroupDashboardVisibility,
    toggleGroupPin,
    moveGroup,
    removeGroup,
    settings,
  } = store;

  const activeGroup = getActiveGroup(store);
  const bookmarks = activeGroup?.bookmarks ?? [];
  const activeGroupTabs = activeGroup?.tabs ?? [];
  const messages = MESSAGES[settings.language];
  const activeGroupName =
    activeGroupId === ALL_GROUP_ID
      ? messages.allGroup
      : activeGroupId === ALL_MY_GROUP_ID
        ? messages.allMyGroup
        : activeGroupId === ALL_SHARED_GROUP_ID
          ? messages.allSharedGroup
          : activeGroupId === UNGROUPED_GROUP_ID
            ? messages.ungrouped
            : (activeGroup?.name ?? messages.ungrouped);
  const hasBookmarkUpdateToday = bookmarks.some((bookmark) =>
    isToday(bookmark.updatedAt),
  );
  const hasGroupUpdateToday = groups.some((group) => isToday(group.updatedAt));

  const {
    tabs: paneTabs,
    activeTabs,
    activePane,
    activeTab,
    split,
  } = getPaneWorkspace(activeGroup);
  const paneActiveTab = (pane: PaneId) => activeTabs[pane];

  const {
    requestCloseTab: requestCloseTabAction,
    addTabToPane,
    moveToGroup,
  } = useHomeTabActions({ editorRefs });

  const navigation = useHomeNavigation({ hydrated, addTabToPane });
  const {
    openPanel,
    selectTabWithHistory,
    activatePaneWithHistory,
    addTabAndRecord,
    moveTabToPaneAndRecord,
    splitTabsLeftAndRecord,
    replaceCurrentView,
    toggleGroupMenu,
    toggleSidePanel,
  } = navigation;

  const requestCloseTab = useCallback(
    (tabId: string) => {
      if (requestCloseTabAction(tabId)) replaceCurrentView();
    },
    [replaceCurrentView, requestCloseTabAction],
  );

  const swipeMobileTab = (direction: "left" | "right", pane?: PaneId) => {
    // Read the workspace at gesture time. Consecutive swipes can arrive before
    // React replaces the footer callback, so render-time tabs may be stale.
    const latestGroup = getActiveGroup(useNotepadStore.getState());
    if (!latestGroup) return false;
    const latestWorkspace = getPaneWorkspace(latestGroup);
    const targetPane = pane ?? latestWorkspace.activePane;
    const tabs = latestWorkspace.tabs[targetPane];
    if (tabs.length < 2) return false;
    const currentIndex = tabs.findIndex(
      (tab) => tab.id === latestWorkspace.activeTabs[targetPane]?.id,
    );
    if (currentIndex < 0) return false;
    const offset = direction === "left" ? 1 : -1;
    const nextIndex = (currentIndex + offset + tabs.length) % tabs.length;
    // Footer swipes navigate tabs without handing editing focus to the newly
    // mounted textarea or reopening the mobile keyboard.
    editorRefs[targetPane].current?.blur();
    setMobileTabSlide((current) => ({
      pane: targetPane,
      direction,
      sequence: (current?.sequence ?? 0) + 1,
    }));
    selectTabWithHistory(tabs[nextIndex].id);
    return true;
  };

  const deleteDashboardTab = useCallback(
    (tabId: string) => {
      deleteTab(tabId);
      replaceCurrentView();
    },
    [deleteTab, replaceCurrentView],
  );

  useNotepadShortcuts({
    editorRefs,
    composingRefs,
    requestCloseTab,
    onSelectTab: selectTabWithHistory,
    onAddTab: addTabAndRecord,
    onToggleGroups: toggleGroupMenu,
    onToggleDashboard: () => toggleSidePanel("dashboard"),
  });
  useEditorFocus(
    editorRefs,
    activeGroupId,
    activePane,
    activeTab?.id ?? "",
    hydrated,
    suppressInitialEditorFocus === true,
  );

  const {
    draggingTabId,
    draggingTabIds,
    selectedTabIds,
    selectTabRange,
    startDrag,
    endDrag,
    adoptTo,
    dropZonesFor,
  } = usePaneDrag({
    group: activeGroup,
    moveTabsToPane: moveTabToPaneAndRecord,
    splitTabsLeft: splitTabsLeftAndRecord,
  });

  const createPaneProps = (pane: PaneId): PaneViewProps | null => {
    const paneTab = paneActiveTab(pane);
    if (!paneTab && pane !== "left") return null;
    return {
      pane,
      groups,
      activeGroupId,
      draggingTabId,
      draggingTabIds,
      selectedTabIds,
      tabs: paneTabs[pane],
      activeTab: paneTab,
      editorRef: editorRefs[pane],
      composingRef: composingRefs[pane],
      isFocused: !split || activePane === pane,
      dropZones: dropZonesFor(pane),
      tabSlide:
        mobileTabSlide?.pane === pane
          ? {
              direction: mobileTabSlide.direction,
              sequence: mobileTabSlide.sequence,
            }
          : undefined,
      onActivate: () => activatePaneWithHistory(pane),
      onSelect: (tabId: string, extendSelection: boolean) => {
        selectTabRange(paneTabs[pane], tabId, extendSelection);
        selectTabWithHistory(tabId);
      },
      onClose: requestCloseTab,
      onMove: (tabIds: string[], toTabId: string) =>
        tabIds.length === 1
          ? moveTab(tabIds[0], toTabId)
          : moveTabs(tabIds, toTabId),
      onMoveToGroup: moveToGroup,
      onAdopt: adoptTo(pane),
      onDragStart: startDrag,
      onDragEnd: endDrag,
      onCycleTabColor: cycleTabColor,
      onToggleBookmark: toggleBookmark,
      onAdd: () => addTabAndRecord(pane),
      onChange: (content: string) => {
        if (paneTab) updateTab(paneTab.id, content);
      },
    };
  };

  const hasRightColumn = paneTabs.right.length > 0;
  const columns: PaneColumnProps[] = COLUMNS.flatMap((column) => {
    const panes = [column, getBottomPane(column)]
      .map(createPaneProps)
      .filter((props): props is PaneViewProps => props !== null);
    if (panes.length === 0) return [];
    return [
      {
        column,
        panes,
        widthRatio:
          column === "left" && hasRightColumn
            ? activeGroup?.splitRatio
            : undefined,
        rowRatio:
          (column === "right"
            ? activeGroup?.rightRowRatio
            : activeGroup?.leftRowRatio) ?? 0.5,
        onResize: column === "right" ? setSplitRatio : undefined,
        onRowResize: (ratio: number) => setRowRatio(column, ratio),
      },
    ];
  });

  return {
    hydrated,
    closedTabs,
    ...navigation,
    openPanel,
    activeGroupId,
    activeTab,
    split,
    bookmarks,
    groups: groups.map((group) =>
      group.id === UNGROUPED_GROUP_ID
        ? { ...group, name: messages.ungrouped }
        : group,
    ),
    activeGroupName,
    hasBookmarkUpdateToday,
    hasGroupUpdateToday,
    swipeMobileTab,
    columns,
    activeGroupTabs,
    tabColorCycle: settings.tabColorCycle,
    moveDashboardTab,
    toggleBookmark,
    moveToGroup,
    deleteDashboardTab,
    removeClosedTab,
    removeBookmark,
    createGroup,
    renameGroup,
    setGroupStatusNames,
    setGroupDashboardVisibility,
    dashboardStatusNames: activeGroup?.dashboardStatusNames ?? {},
    dashboardVisibility:
      activeGroup?.dashboardVisibility ?? DEFAULT_DASHBOARD_VISIBILITY,
    toggleGroupPin,
    moveGroup,
    removeGroup,
    fontScale: settings.fontScale,
    language: settings.language,
    panelSlide: settings.panelSlide,
    panelPosition: settings.panelPosition,
  };
}
