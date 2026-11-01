import type { StateCreator } from "zustand";

import { isAggregateGroupId, UNGROUPED_GROUP_ID } from "../../constant";
import type { NotepadState } from "../../type";
import {
  assignTabToPane,
  compareGroups,
  isSharedGroupId,
  normalizeDashboardStatusNames,
  normalizeDashboardVisibility,
  normalizeLayout,
  SHARED_TAB_DELETE_INTENT_EVENT,
} from "../../util";
import { allocateTab, createGroupEntry } from "./workspace";

type GroupActions = Pick<
  NotepadState,
  | "createGroup"
  | "renameGroup"
  | "setGroupStatusNames"
  | "setGroupDashboardVisibility"
  | "toggleGroupPin"
  | "moveGroup"
  | "removeGroup"
  | "selectGroup"
  | "moveTabToGroup"
  | "adoptSharedGroup"
>;

export const createGroupActions: StateCreator<
  NotepadState,
  [],
  [],
  GroupActions
> = (set, get) => ({
  adoptSharedGroup: (originalId, sharedGroup) =>
    set((state) => {
      const original = state.groups.find((group) => group.id === originalId);
      if (!original) return state;
      const tabIds = new Map(
        original.tabs.map((tab, index) => [
          tab.id,
          sharedGroup.tabs[index]?.id ?? tab.id,
        ]),
      );
      return {
        groups: state.groups.map((group) =>
          group.id === originalId ? sharedGroup : group,
        ),
        activeGroupId:
          state.activeGroupId === originalId
            ? sharedGroup.id
            : state.activeGroupId,
        allGroupActiveTabId: state.allGroupActiveTabId
          ? (tabIds.get(state.allGroupActiveTabId) ?? state.allGroupActiveTabId)
          : null,
        closedTabs: state.closedTabs.map((entry) =>
          entry.groupId === originalId
            ? {
                ...entry,
                groupId: sharedGroup.id,
                tab: { ...entry.tab, id: `${sharedGroup.id}-${entry.tab.id}` },
              }
            : entry,
        ),
      };
    }),
  moveGroup: (groupId, targetId) =>
    set((state) => {
      const ordered = state.groups
        .filter((group) => group.id !== UNGROUPED_GROUP_ID)
        .sort(compareGroups);
      const source = ordered.findIndex((group) => group.id === groupId);
      const target = ordered.findIndex((group) => group.id === targetId);
      if (
        source < 0 ||
        target < 0 ||
        source === target ||
        ordered[source].pinned !== ordered[target].pinned
      )
        return state;
      const [moving] = ordered.splice(source, 1);
      ordered.splice(target, 0, moving);
      const ranks = new Map(ordered.map((group, index) => [group.id, index]));
      return {
        groups: state.groups.map((group) =>
          ranks.has(group.id)
            ? { ...group, sortOrder: ranks.get(group.id) }
            : group,
        ),
      };
    }),
  setGroupStatusNames: (groupId, names) =>
    set((state) => {
      if (isAggregateGroupId(groupId))
        return {
          allGroupDashboardStatusNames: normalizeDashboardStatusNames(names),
        };
      if (!state.groups.some((group) => group.id === groupId)) return state;
      return {
        groups: state.groups.map((group) =>
          group.id === groupId
            ? {
                ...group,
                dashboardStatusNames: normalizeDashboardStatusNames(names),
                updatedAt: Date.now(),
              }
            : group,
        ),
      };
    }),
  setGroupDashboardVisibility: (groupId, visibility) =>
    set((state) => {
      const normalized = normalizeDashboardVisibility(visibility);
      if (isAggregateGroupId(groupId)) {
        return { allGroupDashboardVisibility: normalized };
      }
      if (!state.groups.some((group) => group.id === groupId)) return state;
      if (isSharedGroupId(groupId))
        return {
          sharedDashboardVisibility: {
            ...state.sharedDashboardVisibility,
            [groupId]: normalized,
          },
        };
      return {
        groups: state.groups.map((group) =>
          group.id === groupId
            ? { ...group, dashboardVisibility: normalized }
            : group,
        ),
      };
    }),
  moveTabToGroup: (tabId, groupId) => {
    const state = get();
    const source = state.groups.find((group) =>
      group.tabs.some((tab) => tab.id === tabId),
    );
    if (
      source &&
      source.id !== groupId &&
      state.groups.some((group) => group.id === groupId) &&
      isSharedGroupId(source.id) &&
      typeof window !== "undefined"
    )
      window.dispatchEvent(
        new CustomEvent(SHARED_TAB_DELETE_INTENT_EVENT, {
          detail: { groupId: source.id, tabId },
        }),
      );
    set((state) => {
      const source = state.groups.find((group) =>
        group.tabs.some((tab) => tab.id === tabId),
      );
      const target = state.groups.find((group) => group.id === groupId);
      const tab = source?.tabs.find((item) => item.id === tabId);
      if (!source || !target || !tab || source.id === target.id) return state;

      let remainingTabs = source.tabs.filter((item) => item.id !== tabId);
      let nextTabNumber = state.nextTabNumber;
      // A group may still contain closed records after its last open tab moves.
      // Keep the editor renderable by ensuring the source retains an open tab.
      if (!remainingTabs.some((item) => item.open)) {
        const allocated = allocateTab(state);
        remainingTabs = [...remainingTabs, allocated.tab];
        nextTabNumber = allocated.nextTabNumber;
      }

      const linkedBookmarks = source.bookmarks.filter(
        (bookmark) => bookmark.sourceTabId === tabId,
      );
      const updatedAt = Date.now();

      return {
        nextTabNumber,
        groups: state.groups.map((group) => {
          if (group.id === source.id) {
            return normalizeLayout(
              assignTabToPane(
                {
                  ...group,
                  tabs: remainingTabs,
                  bookmarks: group.bookmarks.filter(
                    (bookmark) => bookmark.sourceTabId !== tabId,
                  ),
                  updatedAt,
                },
                tabId,
                null,
              ),
            );
          }
          if (group.id === target.id) {
            return {
              ...group,
              tabs: [...group.tabs, tab],
              bookmarks: [...group.bookmarks, ...linkedBookmarks],
              activeTabId: tabId,
              activePane: "left",
              updatedAt,
            };
          }
          return group;
        }),
      };
    });
  },
  createGroup: (name) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const state = get();
    const { tab, nextTabNumber } = allocateTab(state);
    const id = `group-${crypto.randomUUID()}`;
    set({
      groups: [
        ...state.groups,
        createGroupEntry(id, trimmedName, Date.now(), tab),
      ],
      activeGroupId: id,
      nextTabNumber,
    });
  },
  renameGroup: (groupId, name) =>
    set((state) => {
      const trimmedName = name.trim().slice(0, 60);
      if (groupId === UNGROUPED_GROUP_ID || !trimmedName) return state;
      return {
        groups: state.groups.map((group) =>
          group.id === groupId
            ? { ...group, name: trimmedName, updatedAt: Date.now() }
            : group,
        ),
      };
    }),
  toggleGroupPin: (groupId) =>
    set((state) => {
      if (groupId === UNGROUPED_GROUP_ID) return state;
      return {
        groups: state.groups.map((group) =>
          group.id === groupId
            ? { ...group, pinned: !group.pinned, updatedAt: Date.now() }
            : group,
        ),
      };
    }),
  removeGroup: (groupId) =>
    set((state) => {
      if (groupId === UNGROUPED_GROUP_ID) return state;
      const removedGroup = state.groups.find((group) => group.id === groupId);
      const ungrouped = state.groups.find(
        (group) => group.id === UNGROUPED_GROUP_ID,
      );
      if (!removedGroup || !ungrouped) return state;

      const nextUngrouped = {
        ...ungrouped,
        tabs: [...ungrouped.tabs, ...removedGroup.tabs],
        bookmarks: [...ungrouped.bookmarks, ...removedGroup.bookmarks],
        activeTabId:
          state.activeGroupId === groupId
            ? removedGroup.activeTabId
            : ungrouped.activeTabId,
        activePane:
          state.activeGroupId === groupId
            ? ("left" as const)
            : ungrouped.activePane,
        updatedAt: Date.now(),
      };
      return {
        groups: state.groups
          .filter((group) => group.id !== groupId)
          .map((group) =>
            group.id === UNGROUPED_GROUP_ID ? nextUngrouped : group,
          ),
        activeGroupId:
          state.activeGroupId === groupId
            ? UNGROUPED_GROUP_ID
            : state.activeGroupId,
      };
    }),
  selectGroup: (groupId) =>
    set((state) =>
      isAggregateGroupId(groupId) ||
      state.groups.some((group) => group.id === groupId)
        ? { activeGroupId: groupId }
        : state,
    ),
});
