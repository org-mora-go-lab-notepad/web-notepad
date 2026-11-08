import { expect, test } from "@playwright/test";

import { dashboardColumn, openPanel, seedDashboardTabs } from "../../__util__";

test("4. Waiting 카드 메뉴에는 To Do 또는 New 이동 바로가기가 없다", async ({
  page,
}) => {
  await seedDashboardTabs(page);
  await openPanel(page, "dashboard-panel");
  const card = dashboardColumn(page, "todo").locator(".dashboard-card", {
    hasText: "Alpha task",
  });
  await card.click({ button: "right" });

  const menu = page.getByRole("menu");
  await expect(menu.getByRole("menuitem", { name: /^Move to / })).toHaveCount(
    0,
  );
  await expect(page.locator(".tab-context-menu-footer")).toHaveCount(0);
});
