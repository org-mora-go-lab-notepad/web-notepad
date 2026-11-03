import { expect, test } from "@playwright/test";

import { openPanel } from "../../__util__";
import {
  dashboardColumn,
  dashboardPanel,
  seedDashboardTabs,
} from "../../__util__";

test("4. 숨긴 탭 카드를 누르면 에디터에 다시 열고 PC 고정 패널을 유지한다", async ({
  page,
}) => {
  await seedDashboardTabs(page);
  await expect(page.locator("textarea")).toHaveValue("Alpha task\nalpha body");
  await page.locator(".tab-item").first().locator(".tab-close").click();
  await expect(page.locator(".tab-item")).toHaveCount(2);
  await openPanel(page, "dashboard-panel");
  await dashboardColumn(page, "todo").locator(".dashboard-card-open").click();
  await expect(page.locator("textarea")).toHaveValue("Alpha task\nalpha body");
  await expect(page.locator(".tab-item")).toHaveCount(3);
  await expect(page.locator(".dashboard-preview")).toHaveCount(0);
  await expect(dashboardPanel(page)).toHaveAttribute("aria-hidden", "false");
});
