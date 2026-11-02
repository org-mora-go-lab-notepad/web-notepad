import { expect, test } from "@playwright/test";

import { DESKTOP_VIEWPORT, MOBILE_VIEWPORT } from "../../__constant__";
import { createGroupWithTab, groupsCommand } from "../../__util__";

test("3. 하단 그룹 버튼은 PC와 모바일에서 현재 그룹명을 표시한다", async ({
  page,
}) => {
  await page.goto("/");
  await groupsCommand(page).click();
  const name = "Very long group name for desktop and mobile line clamp check";
  await createGroupWithTab(page, name);
  for (const viewport of [DESKTOP_VIEWPORT, MOBILE_VIEWPORT]) {
    await page.setViewportSize(viewport);
    await expect(groupsCommand(page).locator("svg.lucide-menu")).toBeVisible();
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
  ).toBeVisible();
});
