import { expect, test } from "@playwright/test";

import {
  authenticateBrowser,
  openMoreMenu,
  readStoredState,
} from "../../__util__";

test("4. PC 기본 세 항목을 모두 해제하면 중앙이 비고 Menu에서 다시 고정한다", async ({
  page,
  context,
}) => {
  await authenticateBrowser(context);
  await page.goto("/");
  for (const id of ["core:groups", "core:dashboard", "core:account"]) {
    const entry = page.locator(`.footer-dock [data-footer-item="${id}"]`);
    await entry.click({ button: "right" });
    await page
      .getByRole("menuitem", { name: "Unpin from footer", exact: true })
      .click();
    await expect(entry).toBeHidden();
  }
  expect((await readStoredState(page)).settings?.footerItems).toEqual([]);
  await page.reload();
  await expect(
    page.locator(".footer-dock .footer-dock-item:visible"),
  ).toHaveCount(0);
  const menu = await openMoreMenu(page);
  await expect(menu.locator(".footer-unpinned-command")).toHaveCount(3);
  await expect(menu.locator(":scope > *").last()).toHaveClass(
    /footer-unpinned-account/,
  );
  for (const id of ["core:groups", "core:dashboard", "core:account"]) {
    const item =
      id === "core:account"
        ? menu.locator(".footer-unpinned-account .auth-command")
        : menu.getByRole("button", {
            name: id === "core:groups" ? "Group" : "Card",
            exact: true,
          });
    await item.click({ button: "right" });
    await page
      .getByRole("menuitem", { name: "Pin to footer", exact: true })
      .click();
    await expect(
      page.locator(`.footer-dock [data-footer-item="${id}"]`),
    ).toBeVisible();
  }
  expect((await readStoredState(page)).settings?.footerItems).toEqual([
    "core:groups",
    "core:dashboard",
    "core:account",
  ]);
});
