import { expect, test } from "@playwright/test";

import { MOBILE_VIEWPORT } from "../../__constant__";
import { openPanel, seedDashboardTabs } from "../../__util__";

test.use({ hasTouch: true, isMobile: true, viewport: MOBILE_VIEWPORT });

test("6. 모바일에서 대시보드를 닫으면 탭 카드 드롭다운도 닫는다", async ({
  page,
}) => {
  await seedDashboardTabs(page);
  await openPanel(page, "dashboard-panel");
  await page.locator(".dashboard-card-open").first().dblclick();
  await expect(page.getByRole("menu", { name: "Tab actions" })).toBeVisible();
  await expect(page.locator(".dashboard-preview")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.locator("#dashboard-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  await expect(page.getByRole("menu", { name: "Tab actions" })).toHaveCount(0);
});
