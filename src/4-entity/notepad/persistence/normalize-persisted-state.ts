import { isAggregateGroupId, UNGROUPED_GROUP_ID } from "../constant";
import type { NotepadState, NoteTab } from "../type";
import {
  isSharedGroupId,
  normalizeDashboardStatusNames,
  normalizeDashboardVisibility,
  normalizeSharedGroupData,
} from "../util";
import { finiteNumberOr, isTabColor } from "./read-value";
import {
  normalizeBookmarks,
  normalizeClosedTabs,
  normalizeGroups,
  normalizeTabs,
} from "./record";
import { normalizeAllGroupLayout, normalizeSettings } from "./view";

export function normalizePersistedState(
  persistedState: unknown,
  currentState: NotepadState,
): NotepadState {
  const persisted = (
    persistedState && typeof persistedState === "object" ? persistedState : {}
  ) as Partial<NotepadState> & {
    tabs?: unknown;
    bookmarks?: unknown;
    activeTabId?: unknown;
    rightTabIds?: unknown;
    activeRightTabId?: unknown;
    activePane?: unknown;
    splitRatio?: unknown;
  };
  const settings = normalizeSettings(persisted.settings);
  const legacyColors =
    persisted.settings?.tabColorCycleVersion !== 2
      ? Array.isArray(persisted.settings?.tabColorCycle)
        ? persisted.settings.tabColorCycle
        : ["gray", "indigo", "teal"]
      : null;
  const legacyDoneColor = legacyColors?.[2];
  const migrateStatus = (tab: NoteTab): NoteTab => {
    if (tab.dashboardStatus === "closed")
      return {
        ...tab,
        dashboardStatus: "done",
        tabColor: isTabColor(legacyDoneColor) ? legacyDoneColor : "teal",
      };
    if (legacyColors && tab.dashboardStatus === "ready")
      return { ...tab, tabColor: settings.tabColorCycle[1] };
    if (
      legacyColors &&
      (!tab.dashboardStatus ||
        tab.dashboardStatus === "todo" ||
        tab.dashboardStatus === "in-progress")
    )
      return {
        ...tab,
        dashboardStatus:
          (["todo", "in-progress", "done"] as const)[
            Math.max(0, legacyColors.indexOf(tab.tabColor))
          ] ?? "todo",
      };
    return tab;
  };
  const hasLegacyTabs = Array.isArray(persisted.tabs);
  const legacyTabs = normalizeTabs(persisted.tabs, currentState.groups[0].tabs);
  const legacyBookmarks = normalizeBookmarks(
    persisted.bookmarks,
    currentState.groups[0].bookmarks,
  );
  const sourceGroups = (
    Array.isArray(persisted.groups) ? persisted.groups : currentState.groups
  ).filter(
    (group) =>
      group && typeof group === "object" && typeof group.id === "string",
  );
  let nextTabNumber = finiteNumberOr(
    persisted.nextTabNumber,
    currentState.nextTabNumber,
  );
  const reservedTabIds = new Set([
    ...legacyTabs.map((tab) => tab.id),
    ...legacyBookmarks.map((bookmark) => bookmark.sourceTabId),
    // A recovered blank tab must not take the identity of a bookmark in any group.
    ...sourceGroups.flatMap((group) => [
      ...normalizeTabs(group.tabs, []).map((tab) => tab.id),
      ...normalizeBookmarks(group.bookmarks, []).map(
        (bookmark) => bookmark.sourceTabId,
      ),
    ]),
  ]);
  while (reservedTabIds.has(`tab-${nextTabNumber}`)) nextTabNumber += 1;

  const groups = normalizeGroups(sourceGroups, {
    fields: persisted,
    tabs: legacyTabs,
    bookmarks: legacyBookmarks,
  });

  for (const group of groups)
    group.tabs = isSharedGroupId(group.id)
      ? normalizeSharedGroupData(group).tabs
      : group.tabs.map(migrateStatus);
  const ungrouped = groups.find((group) => group.id === UNGROUPED_GROUP_ID);
  if (!ungrouped) {
    groups.unshift({
      ...currentState.groups[0],
      tabs: hasLegacyTabs && legacyTabs.length > 0 ? legacyTabs : [],
      bookmarks: legacyBookmarks,
    });
  }

  const requestedActiveGroupId = persisted.activeGroupId;
  const activeGroupId =
    typeof requestedActiveGroupId === "string" &&
    (isAggregateGroupId(requestedActiveGroupId) ||
      groups.some((group) => group.id === requestedActiveGroupId))
      ? requestedActiveGroupId
      : UNGROUPED_GROUP_ID;
  const allGroupLayout = normalizeAllGroupLayout(
    persisted.allGroupLayout,
    groups,
  );

  return {
    ...currentState,
    groups,
    activeGroupId,
    allGroupActiveTabId:
      typeof persisted.allGroupActiveTabId === "string"
        ? persisted.allGroupActiveTabId
        : null,
    allGroupLayout,
    allGroupDashboardVisibility: normalizeDashboardVisibility(
      persisted.allGroupDashboardVisibility,
    ),
    allGroupDashboardStatusNames: normalizeDashboardStatusNames(
      persisted.allGroupDashboardStatusNames,
    ),
    sharedDashboardVisibility: Object.fromEntries(
      Object.entries(
        persisted.sharedDashboardVisibility &&
          typeof persisted.sharedDashboardVisibility === "object"
          ? persisted.sharedDashboardVisibility
          : {},
      )
        .filter(([id]) => isSharedGroupId(id))
        .map(([id, value]) => [id, normalizeDashboardVisibility(value)]),
    ),
    nextTabNumber,
    closedTabs: normalizeClosedTabs(persisted.closedTabs).map((entry) => ({
      ...entry,
      tab: migrateStatus(entry.tab),
    })),
    settings,
  };
}
