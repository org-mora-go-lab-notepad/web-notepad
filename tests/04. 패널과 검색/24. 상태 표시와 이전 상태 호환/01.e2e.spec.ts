import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import { dashboardColumn, openPanel, seedDashboardTabs } from "../../__util__";
test("1. 옵션은 To Do와 Closed를 제공하고 종료 컬럼을 열고 닫는다", async ({
  page,
}) => {
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await seedDashboardTabs(page);
    await openPanel(page, "dashboard-panel");
    await page.locator(".dashboard-options-trigger").click();
    const menu = page.locator("#dashboard-options-menu");
    await expect(menu.getByRole("button")).toHaveText([
      ...(viewport.width <= 512 ? ["Add Tab"] : []),
      "To Do",
      "Closed",
      "Edit Status",
    ]);
    const done = menu.getByRole("button", { name: "Closed", exact: true });
    await expect(done.locator("svg").first()).toHaveClass(
      /lucide-circle-check/,
    );
    await expect(done).toHaveAttribute("aria-pressed", "true");
    await done.click();
    await expect(dashboardColumn(page, "done")).toHaveCount(0);
    await done.click();
    await expect(dashboardColumn(page, "done")).toBeVisible();
    await expect(
      page.locator('.dashboard-column[data-status="closed"]'),
    ).toHaveCount(0);
  }
});
