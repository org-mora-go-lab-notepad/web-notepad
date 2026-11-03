import { expect, type Locator, test } from "@playwright/test";

import {
  authenticateBrowser,
  openMoreMenu,
  openSystemGroupMenu,
} from "../../__util__";

test("2. PC의 그룹·더보기·계정 드롭다운 진입점은 모두 푸터 고정을 제공한다", async ({
  page,
  context,
}) => {
  await authenticateBrowser(context);
  await page.setViewportSize({ width: 1280, height: 844 });
  await page.goto("/");

  const expectPinMenu = async (entry: Locator) => {
    await entry.click({ button: "right" });
    await expect(
      page.getByRole("menuitem", { name: "Pin to footer" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
  };

  for (const name of [
    "All Group",
    "All My Group",
    "All Shared Group",
    "Ungrouped",
  ]) {
    const menu = await openSystemGroupMenu(page);
    await expectPinMenu(menu.getByRole("button", { name, exact: true }));
  }

  for (const name of ["Guide", "Search", "Bookmark", "Settings", "Board"]) {
    const menu = await openMoreMenu(page);
    await expectPinMenu(menu.getByRole("button", { name, exact: true }));
  }

  if (
    (await page
      .locator(".group-select-command")
      .getAttribute("aria-expanded")) === "true"
  )
    await page.locator(".group-select-command").click();
  for (const name of ["Logout", "My Page"]) {
    const account = page.locator(".footer .auth-command");
    if ((await account.getAttribute("aria-expanded")) !== "true")
      await account.click();
    await expectPinMenu(
      page.locator("#account-menu").getByRole("menuitem", {
        name,
        exact: true,
      }),
    );
  }
});
