import { expect, test } from "@playwright/test";

import { createBookmarkFixture } from "../../__fixture__";
import {
  openGlobalSearchPanel,
  readStoredState,
  seedSearchWorkspace,
} from "../../__util__";

test("3. 원본 없는 북마크를 검색해도 탭을 만들거나 북마크를 지우지 않는다", async ({
  page,
}) => {
  await seedSearchWorkspace(page, [
    createBookmarkFixture("saved", "orphan", "Orphan preview"),
  ]);
  await openGlobalSearchPanel(page);
  await page.getByRole("searchbox", { name: "Search tabs" }).fill("Orphan");
  await expect(page.locator(".global-search-empty-state")).toHaveText(
    "No search results",
  );
  await expect(page.locator(".global-search-result")).toHaveCount(0);
  const state = await readStoredState(page);
  expect(state.groups[0].tabs.map((tab) => tab.id)).toEqual(["tab-1"]);
  expect(state.groups[0].bookmarks[0].content).toBe("Orphan preview");
  await expect(page.locator("textarea")).toHaveValue("Editor");
});
