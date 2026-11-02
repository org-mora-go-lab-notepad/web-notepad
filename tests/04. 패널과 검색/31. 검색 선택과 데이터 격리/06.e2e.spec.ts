import { expect, test } from "@playwright/test";

import { createTabFixture } from "../../__fixture__";
import { openGlobalSearchPanel, seedSearchTabs } from "../../__util__";

test("6. 검색 팝업을 다시 열어도 결과를 자동으로 열지 않는다", async ({
  page,
}) => {
  await seedSearchTabs(page, [
    createTabFixture("current", "Editor"),
    createTabFixture("alpha", "Alpha note"),
  ]);
  await openGlobalSearchPanel(page);
  await page.getByRole("searchbox", { name: "Search tabs" }).fill("Alpha");
  await expect(
    page.getByRole("button", { name: "Open tab Alpha note" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await openGlobalSearchPanel(page);
  await expect(
    page.getByRole("searchbox", { name: "Search tabs" }),
  ).toHaveValue("Alpha");
  await expect(page.locator(".global-search-result strong")).toHaveText(
    "Alpha note",
  );
  await expect(page.locator(".global-search-preview")).toHaveCount(0);
  await expect(page.locator("textarea")).toHaveValue("Editor");
});
