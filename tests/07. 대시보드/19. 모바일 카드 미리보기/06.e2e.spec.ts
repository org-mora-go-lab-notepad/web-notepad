import { expect } from "@playwright/test";

import { previewTest as test } from "./__fixture__";
test("6. 바깥 배경은 시트만 닫는다", async ({ page, previewData }) => {
  const card = page.locator(
    '.dashboard-card[data-tab-id="long-note"] .dashboard-card-open',
  );
  const sheet = page.locator(".dashboard-preview");
  const originalOverflow = await page
    .locator("body")
    .evaluate((el) => el.style.overflow);
  await card.click();
  await expect(sheet).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(sheet).not.toBeVisible();
  await expect(page.locator("#dashboard-panel")).toBeVisible();
  await expect(page.locator(".pane-group textarea")).not.toBeVisible();
  await expect(card).toBeFocused();
  expect(await page.locator("body").evaluate((el) => el.style.overflow)).toBe(
    originalOverflow,
  );
  await card.click();
  await expect(sheet).toBeVisible();
  await expect(sheet.locator("textarea")).toBeEditable();
  await expect(sheet.locator("textarea")).toHaveValue(previewData.long.content);
  await expect(sheet.locator("h2")).toHaveText(previewData.long.title);
});
