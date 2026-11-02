import { expect, test } from "@playwright/test";

import { createBookmarkFixture, createTabFixture } from "../../__fixture__";
import { openGlobalSearchPanel, seedSearchTabs } from "../../__util__";

test("4. 북마크한 탭도 중복 없이 탭 결과만 표시한다", async ({ page }) => {
  await seedSearchTabs(
    page,
    [createTabFixture("saved", "Saved needle", { bookmarked: true })],
    [],
    [createBookmarkFixture("copy", "saved", "Saved needle")],
  );
  await openGlobalSearchPanel(page);
  await page
    .getByRole("searchbox", { name: "Search tabs" })
    .fill("Saved needle");
  await expect(page.locator(".global-search-result")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Open tab Saved needle" }),
  ).toBeVisible();
  await expect(
    page.locator(
      ".global-search-bookmarks, .global-search-groups, .global-search-section",
    ),
  ).toHaveCount(0);
  await expect(page.locator(".global-search-result-category")).toContainText(
    "Tab",
  );
  await expect(page.locator(".global-search-result p")).toHaveText(
    "Saved needle",
  );
});
