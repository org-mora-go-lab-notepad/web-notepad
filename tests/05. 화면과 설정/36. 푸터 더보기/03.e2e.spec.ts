import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import { openMoreMenu } from "../../__util__";

test("3. 마이페이지 푸터의 가이드 진입과 닫기를 제공한다", async ({ page }) => {
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await page.goto("/my-page");
    await expect(page.locator(".fixed-page-header")).toBeVisible();
    const menu = await openMoreMenu(page);
    await menu.getByRole("button", { name: "Guide", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    const guide = page.getByRole("dialog");
    await expect(guide).toBeVisible();
    await expect(guide).toContainText("User Guide");
    await expect(page.locator("#group-more-menu")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(guide).toHaveCount(0);
    await expect(page.locator(".footer .more-command")).toBeVisible();
    await expect(page).not.toHaveURL(/panel=guide/);
  }
});
