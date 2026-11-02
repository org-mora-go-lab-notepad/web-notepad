import { expect, test } from "@playwright/test";

import { MOBILE_VIEWPORT } from "../../__constant__";
import {
  createGroupsWithTabs,
  groupMenu,
  groupsCommand,
  groupStatusName,
} from "../../__util__";

test("3. 모바일에서 그룹을 선택하면 드롭다운을 바로 닫는다", async ({
  page,
}) => {
  await page.setViewportSize(MOBILE_VIEWPORT);
  await page.goto("/");
  await createGroupsWithTabs(page, "Work");
  await groupsCommand(page).click();

  await groupMenu(page)
    .locator(".group-item")
    .filter({ hasText: "Work" })
    .getByRole("button", { name: "Work", exact: true })
    .click();

  await expect(groupStatusName(page)).toHaveText("Work");
  await expect(groupMenu(page)).toHaveCount(0);
});
