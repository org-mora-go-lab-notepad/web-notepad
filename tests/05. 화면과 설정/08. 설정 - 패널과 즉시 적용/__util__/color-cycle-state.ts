import type { Page } from "@playwright/test";

import {
  createClosedTabFixture,
  createGroupFixture,
  createTabFixture,
} from "../../../__fixture__";
import { seedStoredStateOnLoad } from "../../../__util__";

export const ARCHIVE_COLOR_CYCLE = ["red", "yellow", "teal"] as const;

export const seedArchivedColorCycle = (page: Page) => {
  const tabs = [
    createTabFixture("tab-todo", "Todo cycle note", {
      tabColor: "red",
      bookmarked: true,
    }),
    createTabFixture("tab-wip", "Doing cycle note", { tabColor: "yellow" }),
    createTabFixture("tab-done", "Done cycle note", { tabColor: "teal" }),
  ];
  return seedStoredStateOnLoad(page, {
    activeGroupId: "ungrouped",
    nextTabNumber: 5,
    settings: {
      fontScale: 1,
      tabColorCycle: [...ARCHIVE_COLOR_CYCLE],
      language: "en",
      groupPosition: "left",
      panelPosition: "right",
    },
    groups: [
      createGroupFixture("ungrouped", "Ungrouped", tabs, {
        bookmarks: [
          {
            id: "bookmark-todo",
            sourceTabId: tabs[0].id,
            title: tabs[0].title,
            content: tabs[0].content,
            tabColor: "red",
            selectedLines: [],
            createdAt: 1,
            updatedAt: 1,
          },
        ],
      }),
    ],
    closedTabs: [
      createClosedTabFixture(
        "closed-cycle",
        "ungrouped",
        createTabFixture("tab-closed", "Closed cycle note", {
          tabColor: "teal",
        }),
      ),
    ],
  });
};
