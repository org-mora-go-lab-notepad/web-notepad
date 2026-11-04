import { expect } from "@playwright/test";

import { previewTest as test } from "./__fixture__";
test("8. PC 전환은 시트를 정리한다", async ({ page, previewData }) => {
  const card = page.locator(
    '.dashboard-card[data-tab-id="long-note"] .dashboard-card-open',
  );
  const sheet = page.locator(".dashboard-preview");
  await card.click();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(sheet).not.toBeVisible();
  await expect(page.locator(".pane-group textarea").first()).toBeVisible();
  await expect(page.locator(".pane-group textarea").first()).toHaveValue(
    previewData.long.content,
  );
  await expect(
    page.locator('.dashboard-card[data-tab-id="long-note"]'),
  ).toHaveClass(/is-active/);
  await expect(
    page.locator("#dashboard-panel .side-panel-header h2"),
  ).toHaveText("Card");
  await expect(page.locator(".header").first()).toHaveCSS("height", "44px");
});
