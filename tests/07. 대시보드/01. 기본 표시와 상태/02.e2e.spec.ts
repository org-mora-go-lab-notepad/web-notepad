import { expect, test } from "@playwright/test";

import { openPanel } from "../../__util__";
import {
  dashboardColumn,
  dashboardPanel,
  seedDashboardTabs,
} from "../../__util__";

test("2. 현재 그룹의 탭을 색상에 따라 Waiting·Done·Closed 컬럼에 분류하고 개수를 표시한다", async ({
  page,
}) => {
  await seedDashboardTabs(page);
  await openPanel(page, "dashboard-panel");
  await expect(
    dashboardPanel(page).locator(".dashboard-statuses h3"),
  ).toHaveText(["To Do1", "Ready0", "Doing1", "Done1"]);
  await expect(dashboardColumn(page, "todo")).toContainText("Alpha task");
  await expect(dashboardColumn(page, "in-progress")).toContainText("Beta task");
  await expect(dashboardColumn(page, "done")).toContainText("Gamma task");
});
