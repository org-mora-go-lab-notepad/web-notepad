import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";
import { authenticateBrowser } from "../../__util__";

test("4. 계정 메뉴는 방향키로 탐색하고 Escape와 바깥 클릭으로 닫는다", async ({
  page,
  context,
}) => {
  await authenticateBrowser(context);
  await openEditor(page);
  const account = page.locator("button.auth-command");
  await account.focus();
  await page.keyboard.press("ArrowUp");
  await expect(
    page.getByRole("menuitem", { name: "Board", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("menuitem", { name: "Logout", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(account).toBeFocused();
  await expect(account).toHaveAttribute("aria-expanded", "false");
  await account.click();
  await page.locator("textarea").first().click();
  await expect(page.locator("#account-menu")).toHaveCount(0);
});
