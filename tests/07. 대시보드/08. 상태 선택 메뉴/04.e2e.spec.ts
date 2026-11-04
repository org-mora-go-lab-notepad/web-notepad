import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import {
  dashboardColumn,
  openPanel,
  seedDashboardTabs,
  switchGroup,
  toggleDashboardStatus,
} from "../../__util__";
test("4. 그룹별 Note와 완료 표시 여부를 새로고침 후에도 복원한다", async ({
  page,
}) => {
  test.setTimeout(60000);
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await seedDashboardTabs(page);
    await openPanel(page, "dashboard-panel");
    await toggleDashboardStatus(page, "icebox");
    await toggleDashboardStatus(page, "done");
    if (viewport.width > 512)
      await page.locator("#dashboard-panel .side-panel-close").click();
    else await page.keyboard.press("Escape");
    await switchGroup(page, "Work");
    await openPanel(page, "dashboard-panel");
    await expect(dashboardColumn(page, "done")).toBeVisible();
    await expect(dashboardColumn(page, "icebox")).toHaveCount(0);
    if (viewport.width > 512)
      await page.locator("#dashboard-panel .side-panel-close").click();
    else await page.keyboard.press("Escape");
    await switchGroup(page, "Ungrouped");
    await openPanel(page, "dashboard-panel");
    await expect(dashboardColumn(page, "done")).toHaveCount(0);
    await expect(dashboardColumn(page, "icebox")).toBeVisible();
    await page.reload();
    await expect(dashboardColumn(page, "done")).toHaveCount(0);
    await expect(dashboardColumn(page, "icebox")).toBeVisible();
  }
});
