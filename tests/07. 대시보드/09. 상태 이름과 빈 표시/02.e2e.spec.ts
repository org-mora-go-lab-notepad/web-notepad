import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import {
  dashboardPanel,
  openPanel,
  readStoredState,
  seedDashboardTabs,
} from "../../__util__";

test("2. 취소·Escape·바깥 클릭으로 상태 이름 편집을 닫으면 변경을 저장하지 않는다", async ({
  page,
}) => {
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await seedDashboardTabs(page);
    await openPanel(page, "dashboard-panel");
    const panel = dashboardPanel(page);
    const trigger = panel.locator(".dashboard-options-trigger");
    for (const method of ["cancel", "escape", "outside"]) {
      await trigger.click();
      await panel
        .getByRole("button", { name: "Edit Status", exact: true })
        .click();
      const editor = page.getByRole("dialog", {
        name: "Edit Status",
        exact: true,
      });
      await editor
        .getByRole("textbox", { name: "Waiting", exact: true })
        .fill("Unsaved");
      if (method === "cancel")
        await editor
          .getByRole("button", { name: "Cancel", exact: true })
          .click();
      else if (method === "escape") await page.keyboard.press("Escape");
      else await page.mouse.click(5, 5);
      await expect(editor).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await expect(panel).toHaveAttribute("aria-hidden", "false");
      expect(
        (await readStoredState(page)).groups[0].dashboardStatusNames,
      ).toBeUndefined();
    }
  }
});
