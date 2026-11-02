import { expect, test } from "@playwright/test";

import {
  bookmarkActiveTab,
  createGroupsWithTabs,
  readStoredState,
} from "../../__util__";

test("2. 북마크는 생성한 그룹에만 저장한다", async ({ page }) => {
  await page.goto("/");
  await createGroupsWithTabs(page, "Work");
  await bookmarkActiveTab(page, "work bookmark");

  const groups = (await readStoredState(page)).groups;
  expect(
    groups
      .find((group) => group.name === "Work")!
      .bookmarks.map((item) => item.content),
  ).toEqual(["work bookmark"]);
  expect(groups.find((group) => group.name === "Ungrouped")!.bookmarks).toEqual(
    [],
  );
});
