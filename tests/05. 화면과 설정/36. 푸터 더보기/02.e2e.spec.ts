import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import { openMoreMenu } from "../../__util__";

test("2. 보드 푸터 더보기에서 검색을 한 번 선택해 연다", async ({ page }) => {
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await page.goto("/board");
    await expect(page.locator(".footer .more-command")).toBeVisible();
    await expect(page.locator("#groups-menu")).toHaveCount(0);
    const menu = await openMoreMenu(page);
    await menu.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page).toHaveURL(/panel=global-search/);
    const search = page.locator("#global-search-popup");
    await expect(search).toBeVisible();
    await expect(page.locator("#group-more-menu")).toHaveCount(0);
    await search.getByRole("searchbox").fill("Footer search");
    await expect(search.getByRole("searchbox")).toHaveValue("Footer search");
    await expect(page.locator("#groups-menu")).toHaveCount(0);
  }
});
