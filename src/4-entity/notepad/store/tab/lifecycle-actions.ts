import type { StateCreator } from "zustand";

import { isAggregateGroupId } from "../../constant";
import type { NotepadState } from "../../type";
import {
  assignTabToPane,
  compareDashboardCards,
  getPaneActiveTabId,
  getPaneOfTab,
  getPaneTabs,
  getStatusColor,
  getTabStatus,
  isSharedGroupId,
  normalizeLayout,
  setPaneActiveTabId,
} from "../../util";
import {
  allocateTab,
  EMPTY_SPLIT_LAYOUT,
  getActiveGroup,
  getTabGroup,
  patchTabAndBookmark,
  updateGroup,
} from "../workspace";

type Actions = Pick<
  NotepadState,
  "moveDashboardTab" | "setTabStatus" | "closeTab" | "archiveTab" | "deleteTab"
>;

export const createTabLifecycleActions: StateCreator<
  NotepadState,
  [],
  [],
  Actions
> = (set, get) => ({
  moveDashboardTab: (tabId, status, targetId, placement = "before") =>
    set((state) => {
      const workspace = getActiveGroup(state);
      const moving = workspace?.tabs.find(
        (tab) => tab.id === tabId && tab.content.trim(),
      );
      if (!workspace || !moving || targetId === tabId) return state;
      const cards = workspace.tabs
        .filter(
          (tab) =>
            tab.id !== tabId &&
            tab.content.trim() &&
            getTabStatus(tab, state.settings.tabColorCycle) === status,
        )
        .sort(compareDashboardCards);
      const targetIndex = cards.findIndex((tab) => tab.id === targetId);
      cards.splice(
        targetIndex < 0
          ? cards.length
          : targetIndex + Number(placement === "after"),
        0,
        moving,
      );
      const ranks = new Map(cards.map((tab, index) => [tab.id, index]));
      const nextColor = getStatusColor(status, state.settings.tabColorCycle);
      const changedStatus =
        getTabStatus(moving, state.settings.tabColorCycle) !== status ||
        moving.tabColor !== nextColor;
      const updatedAt = Date.now();
      return {
        groups: state.groups.map((group) => {
          if (!group.tabs.some((tab) => ranks.has(tab.id))) return group;
          return {
            ...group,
            bookmarks: group.bookmarks.map((bookmark) =>
              bookmark.sourceTabId === tabId && changedStatus
                ? { ...bookmark, tabColor: nextColor, updatedAt }
                : bookmark,
            ),
            tabs: group.tabs.map((tab) =>
              !ranks.has(tab.id)
                ? tab
                : {
                    ...tab,
                    dashboardOrder: ranks.get(tab.id),
                    ...(tab.id === tabId
                      ? {
                          dashboardStatus: status,
                          tabColor: nextColor,
                        }
                      : {}),
                  },
            ),
          };
        }),
      };
    }),
  // Dashboard columns describe status only; changing status never closes a tab.
  setTabStatus: (tabId, status) => {
    set((state) => {
      const group = state.groups.find((item) =>
        item.tabs.some((tab) => tab.id === tabId),
      );
      if (!group) return state;
      const auxiliary = status === "icebox" || status === "closed";
      const tabColor = auxiliary
        ? undefined
        : getStatusColor(status, state.settings.tabColorCycle);
      return updateGroup(state, group.id, (current) =>
        patchTabAndBookmark(
          current,
          tabId,
          {
            ...(tabColor ? { tabColor } : {}),
            dashboardStatus: status === "closed" ? "done" : status,
            dashboardOrder: undefined,
          },
          { ...(tabColor ? { tabColor } : {}), updatedAt: Date.now() },
        ),
      );
    });
  },
  closeTab: (tabId) => {
    hideTabFromEditor(set, get, tabId);
  },
  archiveTab: (tabId) => {
    preserveTabEntry(set, get, tabId);
  },
  deleteTab: (tabId) => {
    // Legacy callers must not permanently remove a tab without confirmation.
    preserveTabEntry(set, get, tabId);
  },
});

const preserveTabEntry = (
  set: (partial: Partial<NotepadState>) => void,
  get: () => NotepadState,
  tabId: string,
) => {
  const group = getTabGroup(get(), tabId);
  if (!group) return;
  if (isSharedGroupId(group.id)) hideTabFromEditor(set, get, tabId);
  else archiveTabEntry(set, get, tabId);
};

const hideTabFromEditor = (
  set: (partial: Partial<NotepadState>) => void,
  get: () => NotepadState,
  tabId: string,
) => {
  const state = get();
  const group = getTabGroup(state, tabId);
  const tab = group?.tabs.find((item) => item.id === tabId);
  if (!group || !tab || !tab.open) return;

  const view = getActiveGroup(state);
  const viewPane = getPaneOfTab(view, tabId);
  const viewIds = getPaneTabs(view, viewPane).map((item) => item.id);
  const remainingViewIds = viewIds.filter((id) => id !== tabId);
  const viewFallback =
    remainingViewIds[
      Math.min(viewIds.indexOf(tabId), remainingViewIds.length - 1)
    ];
  const commit = (changes: Partial<NotepadState>) => {
    if (isAggregateGroupId(state.activeGroupId)) {
      changes = {
        ...changes,
        ...updateGroup(
          { ...state, ...changes },
          state.activeGroupId,
          (current) =>
            getPaneActiveTabId(view, viewPane) === tabId &&
            viewFallback &&
            getPaneTabs(current, viewPane).some(
              (item) => item.id === viewFallback,
            )
              ? setPaneActiveTabId(current, viewPane, viewFallback)
              : current,
        ),
      };
    }
    set(changes);
  };

  const pane = getPaneOfTab(group, tabId);
  const paneIds = getPaneTabs(group, pane).map((item) => item.id);
  const closedIndex = paneIds.indexOf(tabId);
  const nextPaneIds = paneIds.filter((id) => id !== tabId);
  const fallbackId =
    nextPaneIds[Math.min(closedIndex, nextPaneIds.length - 1)] ?? null;
  const remainingOpenTabs = group.tabs.filter(
    (item) => item.id !== tabId && item.open,
  );

  if (remainingOpenTabs.length === 0) {
    const { tab: replacement, nextTabNumber } = allocateTab(state);
    commit({
      ...updateGroup(state, group.id, (current) => ({
        ...current,
        ...EMPTY_SPLIT_LAYOUT,
        splitRatio: current.splitRatio,
        tabs: [
          ...current.tabs.map((item) =>
            item.id === tabId ? { ...item, open: false } : item,
          ),
          replacement,
        ],
        activeTabId: replacement.id,
      })),
      nextTabNumber,
    });
    return;
  }

  commit(
    updateGroup(state, group.id, (current) => {
      let next = assignTabToPane(
        {
          ...current,
          tabs: current.tabs.map((item) =>
            item.id === tabId ? { ...item, open: false } : item,
          ),
        },
        tabId,
        null,
      );
      if (getPaneActiveTabId(current, pane) === tabId) {
        next = setPaneActiveTabId(next, pane, fallbackId);
      }
      if (pane !== "left" && nextPaneIds.length > 0)
        next = { ...next, activePane: pane };
      return normalizeLayout(next);
    }),
  );
};

const archiveTabEntry = (
  set: (partial: Partial<NotepadState>) => void,
  get: () => NotepadState,
  tabId: string,
) => {
  const state = get();
  const group = getTabGroup(state, tabId);
  const tab = group?.tabs.find((item) => item.id === tabId);
  if (!group || !tab) return;
  set({
    closedTabs: [
      {
        id: `closed-${crypto.randomUUID()}`,
        groupId: group.id,
        tab: { ...tab, open: false },
        closedAt: Date.now(),
      },
      ...state.closedTabs,
    ],
  });

  const remainingTabs = group.tabs.filter((item) => item.id !== tabId);
  if (!remainingTabs.some((item) => item.open)) {
    const { tab: replacement, nextTabNumber } = allocateTab(state);
    set({
      ...updateGroup(state, group.id, (current) => ({
        ...current,
        ...EMPTY_SPLIT_LAYOUT,
        splitRatio: current.splitRatio,
        tabs: [...remainingTabs, replacement],
        activeTabId: replacement.id,
      })),
      nextTabNumber,
    });
    return;
  }

  const pane = getPaneOfTab(group, tabId);
  const paneIds = getPaneTabs(group, pane).map((item) => item.id);
  const closedIndex = paneIds.indexOf(tabId);
  const nextPaneIds = paneIds.filter((id) => id !== tabId);
  const fallbackId =
    nextPaneIds[Math.min(closedIndex, nextPaneIds.length - 1)] ?? null;

  set({
    ...updateGroup(state, group.id, (current) => {
      let next = assignTabToPane(
        { ...current, tabs: remainingTabs },
        tabId,
        null,
      );
      if (getPaneActiveTabId(current, pane) === tabId) {
        next = setPaneActiveTabId(next, pane, fallbackId);
      }
      // Closing a tab in a split pane keeps that pane active while it still has tabs.
      if (pane !== "left" && nextPaneIds.length > 0)
        next = { ...next, activePane: pane };
      return normalizeLayout(next);
    }),
  });
};
