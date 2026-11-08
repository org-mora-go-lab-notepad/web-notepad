import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import { dashboardPanel, openPanel, seedDashboardTabs } from "../../__util__";

test("1. PC와 모바일에서 우측 세로 점 메뉴로 상태를 전환하고 선택 영역을 유지한다", async ({
  page,
}) => {
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await seedDashboardTabs(page);
    await openPanel(page, "dashboard-panel");
    const panel = dashboardPanel(page);
    const trigger = panel.locator(".dashboard-options-trigger");
    await expect(panel.locator(".dashboard-footer")).toHaveCount(0);
    await expect(
      panel.locator(".side-panel-header").locator(".dashboard-options-trigger"),
    ).toBeVisible();
    const titleBox = (await panel
      .locator(".side-panel-header h2")
      .boundingBox())!;
    const triggerBox = (await trigger.boundingBox())!;
    if (viewport.width > 512)
      expect(triggerBox.x - titleBox.x - titleBox.width).toBeCloseTo(10, 0);
    else {
      const header = (await panel.locator(".side-panel-header").boundingBox())!;
      expect(
        header.x + header.width - triggerBox.x - triggerBox.width,
      ).toBeLessThanOrEqual(24);
    }
    const iconBox = (await trigger.locator("svg").boundingBox())!;
    expect(iconBox.width).toBeCloseTo(14.4 * 1.2, 1);
    expect(iconBox.height).toBeCloseTo(14.4 * 1.2, 1);
    await trigger.click();
    const menu = panel.getByRole("dialog", { name: "Card options" });
    await expect(menu.locator(".dashboard-done-command")).toHaveText("Closed");
    await expect(
      menu.locator(".dashboard-icebox-command > svg").first(),
    ).toHaveClass(/lucide-sticky-note/);
    const menuBox = (await menu.boundingBox())!;
    expect(menuBox.x).toBeGreaterThanOrEqual(0);
    expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(viewport.width);
    for (const status of ["icebox", "done"] as const) {
      const command = menu.locator(`.dashboard-${status}-command`);
      const initiallyVisible = status === "done";
      await expect(command).toHaveAttribute(
        "aria-pressed",
        String(initiallyVisible),
      );
      await command.click();
      await expect(menu).toBeVisible();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await expect(command).toHaveAttribute(
        "aria-pressed",
        String(!initiallyVisible),
      );
      if (initiallyVisible) {
        await expect(panel.locator(`.dashboard-${status}-column`)).toHaveCount(
          0,
        );
      } else {
        await expect(command.locator(".dashboard-option-check")).toBeVisible();
        await expect(
          panel.locator(`.dashboard-${status}-column`),
        ).toBeVisible();
      }
      await command.click();
      await expect(menu).toBeVisible();
      await expect(command).toHaveAttribute(
        "aria-pressed",
        String(initiallyVisible),
      );
      if (initiallyVisible)
        await expect(
          panel.locator(`.dashboard-${status}-column`),
        ).toBeVisible();
      else
        await expect(panel.locator(`.dashboard-${status}-column`)).toHaveCount(
          0,
        );
    }
  }
});
