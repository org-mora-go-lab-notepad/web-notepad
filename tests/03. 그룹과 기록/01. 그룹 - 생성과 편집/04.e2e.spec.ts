import { expect, test } from "@playwright/test";

import {
  createGroupWithTab,
  groupActionsButton,
  groupsCommand,
} from "../../__util__";

test("4. 기본 Ungrouped 그룹은 삭제할 수 없다", async ({ page }) => {
  await page.goto("/");
  await groupsCommand(page).click();
  await createGroupWithTab(page, "Work");

  await groupActionsButton(page, "Work").click();
  await expect(
    page.getByRole("button", { name: "Delete Work group", exact: true }),
  ).toBeVisible();
  await groupActionsButton(page, "Work").click();
  await page.locator(".system-group-command").click();
  await expect(
    page
      .locator("#group-system-menu")
      .getByRole("button", { name: "Ungrouped" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Delete Ungrouped group" }),
  ).toHaveCount(0);
});
