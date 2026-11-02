import { expect, test } from "@playwright/test";

import { createTabFixture } from "../../__fixture__";
import { openGlobalSearchPanel, seedSearchTabs } from "../../__util__";

test("4. 새 검색어는 이전 탭 결과를 교체한다", async ({ page }) => {
  await seedSearchTabs(page, [
    createTabFixture("current", "Editor"),
    createTabFixture("alpha", "Alpha note"),
    createTabFixture("beta", "Beta note"),
  ]);
  await openGlobalSearchPanel(page);
  const search = page.getByRole("searchbox", { name: "Search tabs" });
  await search.fill("Alpha");
  await expect(page.locator(".global-search-result strong")).toHaveText(
    "Alpha note",
  );
  await search.fill("Beta");
  await expect(page.locator(".global-search-result strong")).toHaveText(
    "Beta note",
  );
  await expect(
    page.getByRole("button", { name: "Open tab Alpha note" }),
  ).toHaveCount(0);
  await expect(page.locator(".global-search-preview")).toHaveCount(0);
  await expect(page.locator("textarea")).toHaveValue("Editor");
});
