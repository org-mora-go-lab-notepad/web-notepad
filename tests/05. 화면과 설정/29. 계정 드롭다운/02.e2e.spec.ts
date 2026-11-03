import { expect } from "@playwright/test";

import { boardTest as test } from "../../__fixture__";
import {
  authenticateBrowser,
  openMoreMenu,
  selectBoardPost,
} from "../../__util__";

test("2. Board는 계정 메뉴에서 제거하고 Menu 마지막 항목으로 항상 보드 목록을 연다", async ({
  page,
  context,
  boardPost,
}) => {
  await authenticateBrowser(context);
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await page.locator("button.auth-command").click();
    await expect(
      page
        .locator("#account-menu")
        .getByRole("menuitem", { name: "Board", exact: true }),
    ).toHaveCount(0);
    await page.keyboard.press("Escape");
    let menu = await openMoreMenu(page);
    await expect(menu.locator(":scope > button").last()).toHaveText("Board");
    await menu.getByRole("button", { name: "Board", exact: true }).click();
    await expect(page).toHaveURL(/\/board$/);
    await expect(page.locator(".board-list")).toBeVisible();
    await selectBoardPost(page, boardPost.title);
    await expect(page).toHaveURL(/\/board\?post=/);
    menu = await openMoreMenu(page);
    await menu.getByRole("button", { name: "Board", exact: true }).click();
    await expect(page).toHaveURL(/\/board$/);
    await expect(page.locator(".board-list")).toBeVisible();
  }
});
