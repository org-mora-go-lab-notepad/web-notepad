import type { Page } from "@playwright/test";

import { createGroupFixture, createTabFixture } from "../../__fixture__";
import { type StoredState, writeStoredState } from "./stored-state";

type Options = {
  withTarget?: boolean;
  splitSource?: boolean;
  sourceRight?: boolean;
  splitTarget?: boolean;
};

export async function seedMoveGroupState(
  page: Page,
  {
    withTarget = true,
    splitSource = false,
    sourceRight = true,
    splitTarget = false,
  }: Options = {},
) {
  const movedTab = createTabFixture("tab-1", "Move me\nselected line", {
    pinned: true,
    bookmarked: true,
    selectedLines: [1],
    tabColor: "red",
  });
  const source = createGroupFixture("ungrouped", "Ungrouped", [movedTab]);
  source.bookmarks = [
    {
      id: "bookmark-tab-1",
      sourceTabId: movedTab.id,
      title: movedTab.title,
      content: movedTab.content,
      tabColor: movedTab.tabColor,
      selectedLines: [1],
      createdAt: 1,
      updatedAt: 1,
    },
  ];
  if (splitSource) {
    source.tabs.push(createTabFixture("tab-3", "Keep source note"));
    source.rightTabIds = [sourceRight ? movedTab.id : "tab-3"];
    source.activeTabId = sourceRight ? "tab-3" : movedTab.id;
    source.activeRightTabId = source.rightTabIds[0];
    source.activePane = sourceRight ? "right" : "left";
  }
  const target = createGroupFixture("target", "Target", [
    createTabFixture("tab-2", "Target note"),
  ]);
  if (splitTarget) {
    target.tabs.push(createTabFixture("tab-4", "Target right note"));
    target.rightTabIds = ["tab-4"];
    target.activeRightTabId = "tab-4";
    target.activePane = "right";
  }
  const state: StoredState = {
    groups: withTarget ? [source, target] : [source],
    activeGroupId: source.id,
    nextTabNumber: 5,
  };
  await writeStoredState(page, state);
  return state;
}

// The seeded "Move me" tab that the move-group tests act on.
export const moveGroupSourceTab = (page: Page) =>
  (page.viewportSize()?.width ?? 1280) <= 512
    ? page.locator('.dashboard-card[data-tab-id="tab-1"] .dashboard-card-open')
    : page.getByRole("tab", { name: "Move me", exact: true });
