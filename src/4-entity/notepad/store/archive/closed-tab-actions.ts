import type { StateCreator } from "zustand";

import { UNGROUPED_GROUP_ID } from "../../constant";
import type { NotepadState } from "../../type";
import {
  getStatusColor,
  getTitleFromContent,
  PERSONAL_TAB_DELETE_INTENT_EVENT,
} from "../../util";
import { allocateTab, updateGroup } from "../workspace";

type ClosedTabActions = Pick<
  NotepadState,
  | "restoreClosedTab"
  | "removeClosedTab"
  | "moveClosedTabToStatus"
  | "moveClosedTabToGroup"
  | "toggleClosedTabBookmark"
>;

export const createClosedTabActions: StateCreator<
  NotepadState,
  [],
  [],
  ClosedTabActions
> = (set, get) => ({
  restoreClosedTab: (entryId) => {
    const state = get();
    const entry = state.closedTabs.find((item) => item.id === entryId);
    if (!entry) return;
    // A tab closed from a since-deleted group goes back to Ungrouped.
    const target =
      state.groups.find((group) => group.id === entry.groupId) ??
      state.groups.find((group) => group.id === UNGROUPED_GROUP_ID);
    if (!target) return;

    // Reissue the ID when another tab has taken it since the tab was closed.
    const idTaken = state.groups.some((group) =>
      group.tabs.some((tab) => tab.id === entry.tab.id),
    );
    const allocated = idTaken ? allocateTab(state) : null;
    const tabId = allocated?.tab.id ?? entry.tab.id;
    const tab = {
      ...entry.tab,
      id: tabId,
      open: true,
      dashboardStatus: "todo" as const,
      dashboardOrder: undefined,
      tabColor: getStatusColor("todo", state.settings.tabColorCycle),
      bookmarked: target.bookmarks.some(
        (bookmark) => bookmark.sourceTabId === tabId,
      ),
    };
    set({
      ...updateGroup(state, target.id, (current) => ({
        ...current,
        tabs: [...current.tabs, tab],
        activeTabId: tabId,
        activePane: "left",
      })),
      activeGroupId: target.id,
      nextTabNumber: allocated?.nextTabNumber ?? state.nextTabNumber,
      closedTabs: state.closedTabs.filter((item) => item.id !== entryId),
    });
  },
  // Moving a closed card changes its status while keeping it closed.
  moveClosedTabToStatus: (entryId, status) => {
    const tabColor = getStatusColor(status, get().settings.tabColorCycle);
    set((state) => ({
      closedTabs: state.closedTabs.map((item) =>
        item.id === entryId
          ? {
              ...item,
              tab: {
                ...item.tab,
                tabColor,
                dashboardStatus: status === "closed" ? "done" : status,
                dashboardOrder: undefined,
              },
            }
          : item,
      ),
    }));
  },
  moveClosedTabToGroup: (entryId, groupId) =>
    set((state) => {
      const entry = state.closedTabs.find((item) => item.id === entryId);
      const source = state.groups.find((group) => group.id === entry?.groupId);
      const target = state.groups.find((group) => group.id === groupId);
      if (!entry || !source || !target || source.id === target.id) return state;
      const linkedBookmark = source.bookmarks.find(
        (bookmark) => bookmark.sourceTabId === entry.tab.id,
      );
      const sourceChanges = updateGroup(state, source.id, (group) => ({
        ...group,
        bookmarks: group.bookmarks.filter(
          (bookmark) => bookmark.sourceTabId !== entry.tab.id,
        ),
      }));
      return {
        ...updateGroup({ ...state, ...sourceChanges }, target.id, (group) => ({
          ...group,
          bookmarks: linkedBookmark
            ? [linkedBookmark, ...group.bookmarks]
            : group.bookmarks,
        })),
        closedTabs: state.closedTabs.map((item) =>
          item.id === entryId ? { ...item, groupId } : item,
        ),
      };
    }),
  toggleClosedTabBookmark: (entryId) =>
    set((state) => {
      const entry = state.closedTabs.find((item) => item.id === entryId);
      const group = state.groups.find((item) => item.id === entry?.groupId);
      if (!entry || !group) return state;
      const existing = group.bookmarks.find(
        (bookmark) => bookmark.sourceTabId === entry.tab.id,
      );
      const createdAt = Date.now();
      return {
        ...updateGroup(state, group.id, (current) => ({
          ...current,
          bookmarks: existing
            ? current.bookmarks.filter(
                (bookmark) => bookmark.id !== existing.id,
              )
            : [
                {
                  id: `bookmark-${entry.tab.id}`,
                  sourceTabId: entry.tab.id,
                  title: getTitleFromContent(
                    entry.tab.content,
                    entry.tab.title,
                  ),
                  content: entry.tab.content,
                  tabColor: entry.tab.tabColor,
                  selectedLines: [...entry.tab.selectedLines],
                  createdAt,
                  updatedAt: createdAt,
                },
                ...current.bookmarks,
              ],
        })),
        closedTabs: state.closedTabs.map((item) =>
          item.id === entryId
            ? {
                ...item,
                tab: { ...item.tab, bookmarked: !existing },
              }
            : item,
        ),
      };
    }),
  removeClosedTab: (entryId) => {
    const entry = get().closedTabs.find((item) => item.id === entryId);
    if (!entry) return;
    if (typeof window !== "undefined")
      window.dispatchEvent(
        new CustomEvent(PERSONAL_TAB_DELETE_INTENT_EVENT, {
          detail: { tabId: entry.tab.id },
        }),
      );
    set((state) => ({
      closedTabs: state.closedTabs.filter((item) => item.id !== entryId),
    }));
  },
});
