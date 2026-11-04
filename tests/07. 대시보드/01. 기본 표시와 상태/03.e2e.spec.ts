import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import { createGroupFixture, createTabFixture } from "../../__fixture__";
import {
  dashboardColumn,
  dashboardPanel,
  ensureEditorTab,
  openPanel,
  writeStoredState,
} from "../../__util__";

test("3. 빈 상태에 상태별 안내를 표시하고 카드가 있는 상태에는 표시하지 않는다", async ({
  page,
}) => {
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await writeStoredState(page, {
      groups: [
        createGroupFixture("ungrouped", "Ungrouped", [
          createTabFixture("tab-1", "", { tabColor: "gray" }),
        ]),
      ],
    });
    await openPanel(page, "dashboard-panel");
    const empty = dashboardPanel(page).locator(".dashboard-empty");
    await expect(empty).toHaveText(["None", "None", "None", "None"]);
    if (viewport.width <= 512) await expect(empty.first()).toBeVisible();
    else await expect(empty.first()).toBeHidden();
    if (viewport.width > 512)
      await dashboardPanel(page).locator(".side-panel-close").click();
    else await page.keyboard.press("Escape");
    await ensureEditorTab(page);
    await page.locator("textarea:visible").first().fill("To Do task");
    await openPanel(page, "dashboard-panel");
    await expect(
      dashboardColumn(page, "todo").locator(".dashboard-empty"),
    ).toHaveCount(0);
    await expect(
      dashboardColumn(page, "todo").locator(".dashboard-card"),
    ).toContainText("To Do task");
  }
});
