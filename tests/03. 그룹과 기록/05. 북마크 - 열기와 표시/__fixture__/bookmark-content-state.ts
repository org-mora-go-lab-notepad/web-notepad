import type { Page } from "@playwright/test";

import { createGroupFixture, createTabFixture } from "../../../__fixture__";
import { openBookmarksPanel, seedStoredStateOnLoad } from "../../../__util__";

export async function seedBookmarkContentItems(page: Page) {
  const detailLines = Array.from({ length: 12 }, (_, index) => `line ${index}`);
  await seedStoredStateOnLoad(page, {
    activeGroupId: "ungrouped",
    groups: [
      createGroupFixture(
        "ungrouped",
        "Ungrouped",
        [createTabFixture("tab", "")],
        {
          bookmarks: [
            [
              "Bookmark title",
              ["Bookmark title", "", ...detailLines].join("\n"),
            ],
            ["Title only", "Title only"],
          ].map(([title, content], index) => ({
            id: `bookmark-${index}`,
            sourceTabId: `missing-tab-${index}`,
            title,
            content,
            tabColor: "green" as const,
            selectedLines: [],
            createdAt: 2 - index,
            updatedAt: 2 - index,
          })),
        },
      ),
    ],
  });
  await page.locator(".group-select-command").click();
  await openBookmarksPanel(page);
  return { detailLines };
}
