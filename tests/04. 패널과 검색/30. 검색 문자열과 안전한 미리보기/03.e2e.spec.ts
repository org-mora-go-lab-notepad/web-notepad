import { expect, test } from "@playwright/test";

import { createTabFixture } from "../../__fixture__";
import { openGlobalSearchPanel, seedSearchTabs } from "../../__util__";

test("3. 검색어 앞뒤 공백을 제외하고 탭을 검색한다", async ({ page }) => {
  await seedSearchTabs(page, [
    createTabFixture("trim", "Trim needle"),
    createTabFixture("other", "Other note"),
  ]);
  await openGlobalSearchPanel(page);
  const input = page.getByRole("searchbox", { name: "Search tabs" });
  await input.fill("  needle  ");
  await expect(input).toHaveValue("  needle  ");
  await expect(page.locator(".global-search-result")).toHaveCount(1);
  await expect(page.locator(".global-search-result strong")).toHaveText(
    "Trim needle",
  );
  await expect(page.locator(".global-search-result mark")).toHaveText([
    "needle",
    "needle",
  ]);
  await expect(page.locator(".global-search-empty-state")).toHaveCount(0);
});
