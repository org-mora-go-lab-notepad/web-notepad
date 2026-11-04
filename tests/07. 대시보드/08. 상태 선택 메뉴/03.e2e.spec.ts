import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import { dashboardPanel, openPanel, seedDashboardTabs } from "../../__util__";

test("3. Escape는 상태 선택 영역만 닫고 메뉴 버튼으로 포커스를 돌려준다", async ({
  page,
}) => {
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await seedDashboardTabs(page);
    await openPanel(page, "dashboard-panel");
    const panel = dashboardPanel(page);
    const trigger = panel.locator(".dashboard-options-trigger");
    await trigger.click();
    await panel.locator(".dashboard-icebox-command").focus();
    await page.keyboard.press("Escape");
    await expect(panel.locator(".dashboard-options-menu")).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(panel).toHaveAttribute("aria-hidden", "false");
    await page.keyboard.press("Escape");
    await expect(panel).toHaveAttribute("aria-hidden", "false");
  }
});
