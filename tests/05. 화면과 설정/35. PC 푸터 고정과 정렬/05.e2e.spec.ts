import { expect, test } from "@playwright/test";

import {
  authenticateBrowser,
  openMoreMenu,
  writeStoredState,
} from "../../__util__";

test("5. 해제한 Group Card 계정은 Menu 하단에서 첫 클릭으로 해당 기능을 연다", async ({
  page,
  context,
}) => {
  await authenticateBrowser(context);
  await writeStoredState(page, { settings: { footerItems: [] } });
  let menu = await openMoreMenu(page);
  await menu.getByRole("button", { name: "Group", exact: true }).click();
  await expect(page.locator("#groups-menu")).toBeVisible();
  await expect(menu).toHaveCount(0);
  menu = await openMoreMenu(page);
  await menu.getByRole("button", { name: "Card", exact: true }).click();
  await expect(page.locator("#dashboard-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  menu = await openMoreMenu(page);
  const account = menu.locator(".footer-unpinned-account .auth-command");
  await account.click();
  const accountMenu = page.locator("#account-menu");
  await expect(accountMenu.getByRole("menuitem")).toHaveText([
    "Logout",
    "My Page",
  ]);
  await page.keyboard.press("ArrowDown");
  await expect(
    accountMenu.getByRole("menuitem", { name: "My Page", exact: true }),
  ).toBeFocused();
  await accountMenu
    .getByRole("menuitem", { name: "My Page", exact: true })
    .click();
  await expect(page).toHaveURL(/\/my-page$/);
  await expect(
    page.locator(".footer-dock .footer-dock-item:visible"),
  ).toHaveCount(0);
});
