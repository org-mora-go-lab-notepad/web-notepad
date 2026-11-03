import { expect, test } from "@playwright/test";

import { groupsCommand, moreCommand } from "../../__util__";

test("2. 더보기의 Bookmark 명령은 북마크 팝업을 연다", async ({ page }) => {
  await page.goto("/");
  await groupsCommand(page).click();
  const command = moreCommand(page);
  await command.click();
  const menu = page.locator("#group-more-menu");
  await expect(menu).toHaveCSS("width", "176px");
  await expect(menu.getByRole("button")).toHaveText([
    "Guide",
    "Search",
    "Bookmark",
    "Settings",
    "Board",
  ]);
  await menu.getByRole("button", { name: "Bookmark" }).click();
  await expect(page.locator("#bookmarks-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  await expect(page.locator("#groups-menu")).toBeVisible();
  await expect(command.locator(".status-count")).toHaveCount(0);
  await expect(command.locator(".status-dot")).toHaveCount(0);
});
