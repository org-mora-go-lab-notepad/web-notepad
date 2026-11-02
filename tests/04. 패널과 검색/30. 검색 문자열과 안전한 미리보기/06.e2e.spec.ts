import { expect, test } from "@playwright/test";

import {
  createBookmarkFixture,
  createGroupFixture,
  createTabFixture,
} from "../../__fixture__";
import {
  openGlobalSearchPanel,
  readStoredState,
  seedSearchTabs,
} from "../../__util__";

test("6. 그룹명과 북마크에만 일치하는 검색어는 탭 결과를 만들지 않는다", async ({
  page,
}) => {
  await seedSearchTabs(
    page,
    [createTabFixture("editor", "Editor")],
    [
      createGroupFixture(
        "work",
        "Project Orion",
        [createTabFixture("budget", "Budget")],
        { bookmarks: [createBookmarkFixture("orphan", "gone", "Orion saved")] },
      ),
    ],
  );
  await openGlobalSearchPanel(page);
  await page.getByRole("searchbox", { name: "Search tabs" }).fill("Orion");
  await expect(page.locator(".global-search-empty-state")).toHaveText(
    "No search results",
  );
  await expect(page.locator(".global-search-result")).toHaveCount(0);
  await expect(page.locator("textarea")).toHaveValue("Editor");
  const state = await readStoredState(page);
  expect(state.groups.find((group) => group.id === "work")?.name).toBe(
    "Project Orion",
  );
  expect(
    state.groups.find((group) => group.id === "work")?.bookmarks[0].content,
  ).toBe("Orion saved");
});
