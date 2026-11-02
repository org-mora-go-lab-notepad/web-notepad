import { UNGROUPED_GROUP_ID } from "../../constant";
import type { BookmarkEntry, GroupEntry, NoteTab, PaneId } from "../../type";
import {
  normalizeDashboardStatusNames,
  normalizeDashboardVisibility,
  normalizeLayout,
  PANE_IDS,
} from "../../util";
import { finiteNumberOr } from "../read-value";
import { normalizeBookmarks, normalizeTabs } from "./normalize-records";

type LegacyWorkspace = {
  fields: Partial<
    Record<
      "rightTabIds" | "activeTabId" | "activeRightTabId" | "activePane",
      unknown
    >
  >;
  tabs: NoteTab[];
  bookmarks: BookmarkEntry[];
};

export function normalizeGroups(
  sourceGroups: GroupEntry[],
  legacy: LegacyWorkspace,
): GroupEntry[] {
  return sourceGroups
    .filter((group) => group && typeof group.id === "string")
    .map((group) => {
      const id = group.id;
      const hasWorkspace = Array.isArray(group.tabs);
      // Groups saved before workspaces existed take their pane state from the legacy top-level fields.
      const fromSource = (
        key: "rightTabIds" | "activeTabId" | "activeRightTabId" | "activePane",
        fallback: unknown,
      ): unknown =>
        hasWorkspace
          ? group[key]
          : id === UNGROUPED_GROUP_ID
            ? legacy.fields[key]
            : fallback;
      const tabs = hasWorkspace
        ? normalizeTabs(group.tabs, [])
        : id === UNGROUPED_GROUP_ID
          ? legacy.tabs
          : [];
      const bookmarks = hasWorkspace
        ? normalizeBookmarks(group.bookmarks, [])
        : id === UNGROUPED_GROUP_ID
          ? legacy.bookmarks
          : [];
      const openTabs = tabs.filter((tab) => tab.open);
      const tabIds = new Set(openTabs.map((tab) => tab.id));
      const readTabIds = (value: unknown) =>
        Array.isArray(value)
          ? value.filter(
              (tabId): tabId is string =>
                typeof tabId === "string" && tabIds.has(tabId),
            )
          : [];
      const readActiveId = (value: unknown) =>
        typeof value === "string" && tabIds.has(value) ? value : null;
      const rightTabIds = readTabIds(fromSource("rightTabIds", []));
      const sourceActiveTabId = fromSource("activeTabId", null);
      const activeTabId =
        typeof sourceActiveTabId === "string" && tabIds.has(sourceActiveTabId)
          ? sourceActiveTabId
          : (openTabs[0]?.id ?? "");
      const sourceActivePane = fromSource("activePane", "left");
      const createdAt = finiteNumberOr(group.createdAt, Date.now());
      return normalizeLayout({
        ...(group.dashboardStatusNames
          ? {
              dashboardStatusNames: normalizeDashboardStatusNames(
                group.dashboardStatusNames,
              ),
            }
          : {}),
        dashboardVisibility: normalizeDashboardVisibility(
          group.dashboardVisibility,
        ),
        id,
        name: typeof group.name === "string" ? group.name : "Untitled Group",
        pinned: id !== UNGROUPED_GROUP_ID && group.pinned === true,
        ...(typeof group.sortOrder === "number" &&
        Number.isFinite(group.sortOrder)
          ? { sortOrder: group.sortOrder }
          : {}),
        createdAt,
        updatedAt: finiteNumberOr(group.updatedAt, createdAt),
        tabs,
        bookmarks,
        activeTabId,
        rightTabIds,
        activeRightTabId: readActiveId(fromSource("activeRightTabId", null)),
        leftBottomTabIds: hasWorkspace
          ? readTabIds(group.leftBottomTabIds)
          : [],
        activeLeftBottomTabId: hasWorkspace
          ? readActiveId(group.activeLeftBottomTabId)
          : null,
        rightBottomTabIds: hasWorkspace
          ? readTabIds(group.rightBottomTabIds)
          : [],
        activeRightBottomTabId: hasWorkspace
          ? readActiveId(group.activeRightBottomTabId)
          : null,
        activePane: PANE_IDS.includes(sourceActivePane as PaneId)
          ? (sourceActivePane as PaneId)
          : "left",
        // Split ratios reset to the center on every visit.
        splitRatio: 0.5,
        leftRowRatio: 0.5,
        rightRowRatio: 0.5,
      });
    });
}
