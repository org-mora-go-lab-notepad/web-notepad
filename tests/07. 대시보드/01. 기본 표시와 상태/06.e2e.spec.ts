import { expect, test } from "@playwright/test";

import {
  dashboardPanel,
  groupsCommand,
  openPanel,
  openSettingsPanel,
} from "../../__util__";

test("6. PC 대시보드를 페이지 전체 영역으로 확장하고 기존 크기로 축소한다", async ({
  page,
}) => {
  await page.goto("/");
  await openSettingsPanel(page);
  const settings = page.locator("#settings-panel");
  await settings
    .getByRole("radiogroup", { name: "Panel Position", exact: true })
    .getByRole("radio", { name: "Left", exact: true })
    .check();
  await settings
    .getByRole("button", { name: "Close Settings", exact: true })
    .click();
  await groupsCommand(page).click();
  await expect(page.locator("#groups-menu")).toBeVisible();
  await openPanel(page, "dashboard-panel");

  const panel = dashboardPanel(page);
  const expand = panel.getByRole("button", { name: "Expand card" });
  const options = panel.locator(".dashboard-options-trigger");
  const expandBounds = (await expand.boundingBox())!;
  const optionsBounds = (await options.boundingBox())!;
  expect(optionsBounds.x + optionsBounds.width).toBeLessThanOrEqual(
    expandBounds.x,
  );

  await expand.click();
  await expect(
    panel.getByRole("button", { name: "Collapse card" }),
  ).toHaveAttribute("aria-pressed", "true");
  const expandedBounds = (await panel.boundingBox())!;
  expect(expandedBounds.x).toBe(0);
  expect(expandedBounds.y).toBe(0);
  expect(expandedBounds.width).toBe(page.viewportSize()!.width);
  expect(expandedBounds.height).toBe(page.viewportSize()!.height);
  expect(await page.evaluate(() => document.fullscreenElement)).toBeNull();
  expect(
    await page.evaluate(
      () => document.elementFromPoint(20, 100)?.closest("#dashboard-panel")?.id,
    ),
  ).toBe("dashboard-panel");

  await panel.getByRole("button", { name: "Collapse card" }).click();
  await expect(panel).not.toHaveCSS("width", `${page.viewportSize()!.width}px`);
});
