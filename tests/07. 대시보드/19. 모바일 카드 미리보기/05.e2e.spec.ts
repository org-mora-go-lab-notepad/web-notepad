import { expect } from "@playwright/test";

import { previewTest as test } from "./__fixture__";
test("5. 뒤로가기는 시트만 닫는다", async ({ page, previewData }) => {
  const card = page.locator(
    '.dashboard-card[data-tab-id="long-note"] .dashboard-card-open',
  );
  const sheet = page.locator(".dashboard-preview");
  await card.click();
  await expect(sheet).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => Boolean(history.state?.notepadBottomSheet)))
    .toBe(true);
  await page.goBack();
  await expect(sheet).not.toBeVisible();
  await expect(card.locator("strong")).toHaveText(previewData.long.title);
  await expect(page.locator("#dashboard-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  await expect(
    page.locator('.dashboard-card[data-tab-id="long-note"]'),
  ).toHaveClass(/is-active/);
});
