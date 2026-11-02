import { expect, test } from "@playwright/test";

import {
  createGroupsWithTabs,
  groupMenu,
  groupsCommand,
  groupStatusName,
} from "../../__util__";

test("2. PC에서 그룹을 선택하면 드롭다운을 열린 채 유지한다", async ({
  page,
}) => {
  await page.goto("/");
  await createGroupsWithTabs(page, "Work");
  await groupsCommand(page).click();

  await groupMenu(page)
    .locator(".group-item")
    .filter({ hasText: "Work" })
    .getByRole("button", { name: "Work", exact: true })
    .click();

  await expect(groupStatusName(page)).toHaveText("Work");
  await expect(groupMenu(page)).toBeVisible();
});
