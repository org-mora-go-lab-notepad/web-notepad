import { expect, test } from "@playwright/test";

import { DESKTOP_VIEWPORT, MOBILE_VIEWPORT } from "../../__constant__";
import { createGroupWithTab, groupsCommand } from "../../__util__";

test("3. PC 푸터는 그룹명을 표시하고 모바일은 Group과 카드 헤더 그룹명을 표시한다", async ({
  page,
}) => {
  await page.goto("/");
  await groupsCommand(page).click();
  const name = "Very long group name for desktop and mobile line clamp check";
  await createGroupWithTab(page, name);
  for (const viewport of [DESKTOP_VIEWPORT, MOBILE_VIEWPORT]) {
    await page.setViewportSize(viewport);
    await expect(
      groupsCommand(page).locator("svg.lucide-layers"),
    ).toBeVisible();
    await expect(groupsCommand(page)).toHaveAttribute(
      "aria-label",
      "Toggle groups",
    );
    await expect(
      groupsCommand(page).locator(".group-current-value"),
    ).toHaveText(name);
  }

  await page.setViewportSize(DESKTOP_VIEWPORT);
  await expect(page.locator(".current-group-panel")).toHaveCount(0);
  await expect(groupsCommand(page).locator(".group-current-value")).toHaveText(
    name,
  );
  await page.setViewportSize(MOBILE_VIEWPORT);
  await expect(
    groupsCommand(page).locator(".group-current-value"),
  ).not.toBeVisible();
  await expect(groupsCommand(page).locator(".group-command-label")).toHaveText(
    "Group",
  );
  await page.locator(".dashboard-command").click();
  await expect(
    page.locator("#dashboard-panel .side-panel-header h2"),
  ).toHaveText(name);
});
