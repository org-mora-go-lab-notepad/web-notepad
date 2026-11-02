import { expect, test } from "@playwright/test";

import { createBookmarkFixture } from "../../__fixture__";
import {
  openBookmarksPanel,
  readActiveGroup,
  restoreWorkspace,
} from "../../__util__";

test("2. 원본 ID가 손상된 북마크도 내용을 보존해 북마크 목록에서 볼 수 있다", async ({
  page,
}) => {
  await restoreWorkspace(page, {
    bookmarks: [
      {
        ...createBookmarkFixture("b1", "tab-1", "Orphan kept"),
        sourceTabId: null,
      },
    ],
  });
  expect((await readActiveGroup(page)).bookmarks[0]).toMatchObject({
    sourceTabId: "",
    content: "Orphan kept",
  });
  await openBookmarksPanel(page);
  await expect(page.locator(".bookmark-item strong")).toHaveText("Orphan kept");
  await expect(page.locator(".bookmark-item-open")).toHaveAccessibleName(
    "Open bookmark Orphan kept",
  );
  expect((await readActiveGroup(page)).bookmarks).toHaveLength(1);
});
