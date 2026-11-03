import { expect, test } from "@playwright/test";

import { DESKTOP_VIEWPORT } from "../../__constant__";
import { openPanel, openSettingsPanel } from "../../__util__";
import { dragPanelEdgeTo } from "../__util__";

test("4. 좌측에 배치한 고정 패널의 크기를 조절할 수 있다", async ({ page }) => {
  await page.setViewportSize(DESKTOP_VIEWPORT);
  await page.goto("/");
  await openSettingsPanel(page);
  await page
    .locator("#settings-panel")
    .getByRole("radiogroup", { name: "Panel Position", exact: true })
    .getByRole("radio", { name: "Left", exact: true })
    .check();
  await page.locator("#settings-panel .side-panel-close").click();
  await openPanel(page, "dashboard-panel");
  const panel = page.locator("#dashboard-panel");

  await dragPanelEdgeTo(page, "dashboard-panel", 600);

  await expect
    .poll(async () => (await panel.boundingBox())!.width)
    .toBeCloseTo(600, 1);
});
