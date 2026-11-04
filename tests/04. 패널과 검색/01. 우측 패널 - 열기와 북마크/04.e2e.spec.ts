import { expect, test } from "@playwright/test";

import { openPanel } from "../../__util__";
import { RIGHT_PANEL_VIEWPORTS } from "../__constant__";

test("4. 뒤로가기는 모바일 패널을 닫고 PC 고정 패널을 유지한다", async ({
  page,
}) => {
  await page.goto("/");
  for (const { viewport, panelIds } of RIGHT_PANEL_VIEWPORTS) {
    await page.setViewportSize(viewport);
    for (const panelId of panelIds) {
      const panel = page.locator(`#${panelId}`);
      if (viewport.width <= 512 && panelId === "dashboard-panel")
        await page.locator(".group-select-command").click();
      await openPanel(page, panelId);
      await expect(panel).toHaveAttribute("aria-hidden", "false");
      await page.goBack();
      await expect(panel).toHaveAttribute(
        "aria-hidden",
        viewport.width >= 641 ||
          (viewport.width <= 512 && panelId === "dashboard-panel")
          ? "false"
          : "true",
      );
      if (viewport.width >= 641)
        await panel.locator(".side-panel-close").click();
    }
  }
});
