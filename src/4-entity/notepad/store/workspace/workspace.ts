import {
  ALL_GROUP_NAME,
  ALL_MY_GROUP_ID,
  ALL_MY_GROUP_NAME,
  ALL_SHARED_GROUP_ID,
  ALL_SHARED_GROUP_NAME,
  isAggregateGroupId,
} from "../../constant";
import type {
  BookmarkEntry,
  GroupEntry,
  NotepadState,
  NoteTab,
  TabColor,
} from "../../type";
import {
  createNoteTab,
  DEFAULT_DASHBOARD_VISIBILITY,
  getNextTabNumber,
  getPaneActiveTabId,
  getPaneLayout,
  getPaneOfTab,
  getStatusColor,
  getTabStatus,
  isSharedGroupId,
  normalizeLayout,
  setPaneActiveTabId,
} from "../../util";

// All gathers the original tabs and applies only its own independent view layout.
const buildAllGroup = (state: NotepadState, groupId: string): GroupEntry => {
  const sourceGroups = state.groups.filter((group) =>
    groupId === ALL_MY_GROUP_ID
      ? !isSharedGroupId(group.id)
      : groupId === ALL_SHARED_GROUP_ID
        ? isSharedGroupId(group.id)
        : true,
  );
  const originals = sourceGroups.flatMap((group) => group.tabs);
  const blanks = originals.filter((tab) => tab.open && !tab.content.trim());
  const blankId =
    blanks.find((tab) => tab.id === state.allGroupActiveTabId)?.id ??
    blanks[0]?.id;
  const tabs = originals.map((tab) =>
    tab.open && !tab.content.trim() && tab.id !== blankId
      ? { ...tab, open: false }
      : tab,
  );
  const openTabs = tabs.filter((tab) => tab.open);
  const activeTab =
    openTabs.find((tab) => tab.id === state.allGroupActiveTabId) ?? openTabs[0];
  return normalizeLayout({
    id: groupId,
    name:
      groupId === ALL_MY_GROUP_ID
        ? ALL_MY_GROUP_NAME
        : groupId === ALL_SHARED_GROUP_ID
          ? ALL_SHARED_GROUP_NAME
          : ALL_GROUP_NAME,
    pinned: false,
    createdAt: 0,
    updatedAt: 0,
    tabs,
    bookmarks: [],
    dashboardVisibility: state.allGroupDashboardVisibility,
    dashboardStatusNames: state.allGroupDashboardStatusNames,
    ...EMPTY_SPLIT_LAYOUT,
    activeTabId: activeTab?.id ?? "",
    ...state.allGroupLayout,
  });
};

export const getActiveGroup = (state: NotepadState) => {
  if (isAggregateGroupId(state.activeGroupId))
    return buildAllGroup(state, state.activeGroupId);
  const group =
    state.groups.find((group) => group.id === state.activeGroupId) ??
    state.groups[0];
  return group && isSharedGroupId(group.id)
    ? {
        ...group,
        dashboardVisibility:
          state.sharedDashboardVisibility[group.id] ??
          DEFAULT_DASHBOARD_VISIBILITY,
      }
    : group;
};

// The group a tab edit applies to: the All lists tabs of every group, so a tab edit goes to its own group.
export const getTabGroup = (state: NotepadState, tabId: string) =>
  isAggregateGroupId(state.activeGroupId)
    ? state.groups.find((group) => group.tabs.some((tab) => tab.id === tabId))
    : getActiveGroup(state);

export const getEditableGroup = getActiveGroup;

export const updateGroup = (
  state: NotepadState,
  groupId: string,
  update: (group: GroupEntry) => GroupEntry,
) => {
  if (isAggregateGroupId(groupId)) {
    const next = normalizeLayout(update(buildAllGroup(state, groupId)));
    return {
      allGroupLayout: getPaneLayout(next),
      allGroupActiveTabId: getPaneActiveTabId(next, next.activePane),
    };
  }
  return {
    groups: state.groups.map((group) =>
      group.id === groupId ? update(group) : group,
    ),
  };
};

const getAllTabs = (state: NotepadState) =>
  state.groups.flatMap((group) => group.tabs);

const getReservedTabIds = (state: NotepadState) =>
  state.groups.flatMap((group) =>
    group.bookmarks.map((bookmark) => bookmark.sourceTabId),
  );

export const allocateTab = (state: NotepadState) => {
  const number = getNextTabNumber(
    getAllTabs(state),
    getReservedTabIds(state),
    state.nextTabNumber,
  );
  return {
    tab: {
      ...createNoteTab(number, state.settings.tabColorCycle[0]),
      ...(state.activeGroupId.startsWith("shared-")
        ? { id: `${state.activeGroupId}-tab-${crypto.randomUUID()}` }
        : {}),
    },
    number,
    nextTabNumber: number + 1,
  };
};

// Pane fields of a workspace with every tab in the left pane.
export const EMPTY_SPLIT_LAYOUT = {
  rightTabIds: [],
  activeRightTabId: null,
  leftBottomTabIds: [],
  activeLeftBottomTabId: null,
  rightBottomTabIds: [],
  activeRightBottomTabId: null,
  activePane: "left",
  splitRatio: 0.5,
  leftRowRatio: 0.5,
  rightRowRatio: 0.5,
} satisfies Partial<GroupEntry>;

export const createGroupEntry = (
  id: string,
  name: string,
  createdAt: number,
  tab?: NoteTab,
): GroupEntry => ({
  id,
  name,
  pinned: false,
  createdAt,
  updatedAt: createdAt,
  tabs: tab ? [tab] : [],
  bookmarks: [],
  dashboardVisibility: { ...DEFAULT_DASHBOARD_VISIBILITY },
  ...EMPTY_SPLIT_LAYOUT,
  activeTabId: tab?.id ?? "",
});

export const activateTab = (group: GroupEntry, tabId: string): GroupEntry => {
  const pane = getPaneOfTab(group, tabId);
  return { ...setPaneActiveTabId(group, pane, tabId), activePane: pane };
};

// Applies the same change to a tab and the bookmark linked to it.
export const patchTabAndBookmark = (
  group: GroupEntry,
  tabId: string,
  tabPatch: Partial<NoteTab>,
  bookmarkPatch: Partial<BookmarkEntry> = {},
): GroupEntry => ({
  ...group,
  tabs: group.tabs.map((tab) =>
    tab.id === tabId ? { ...tab, ...tabPatch } : tab,
  ),
  bookmarks: group.bookmarks.map((bookmark) =>
    bookmark.sourceTabId === tabId
      ? { ...bookmark, ...bookmarkPatch }
      : bookmark,
  ),
});

// Recolor the three configurable statuses while keeping explicit Note and Done records intact.
export const withTabColorCycle = (
  state: NotepadState,
  tabColorCycle: TabColor[],
) => {
  const previous = state.settings.tabColorCycle;
  const recolorTab = (tab: NoteTab) => {
    const status = getTabStatus(tab, previous);
    return {
      ...tab,
      dashboardStatus: status,
      tabColor:
        status === "icebox" || status === "done"
          ? tab.tabColor
          : getStatusColor(status, tabColorCycle),
    };
  };
  const recolor = (color: TabColor) => {
    const index = previous.indexOf(color);
    return index >= 0 && tabColorCycle[index] ? tabColorCycle[index] : color;
  };
  return {
    settings: {
      ...state.settings,
      tabColorCycle,
      tabColorCycleVersion: 2 as const,
    },
    groups: state.groups.map((group) => ({
      ...group,
      tabs: group.tabs.map(recolorTab),
      bookmarks: group.bookmarks.map((bookmark) => ({
        ...bookmark,
        tabColor: group.tabs.find((tab) => tab.id === bookmark.sourceTabId)
          ? recolorTab(
              group.tabs.find((tab) => tab.id === bookmark.sourceTabId)!,
            ).tabColor
          : recolor(bookmark.tabColor),
      })),
    })),
    closedTabs: state.closedTabs.map((entry) => ({
      ...entry,
      tab: recolorTab(entry.tab),
    })),
  };
};
