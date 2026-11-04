import { expect } from "@playwright/test";

import { flickSheet } from "../20. 모바일 카드 조작/__util__";
import { previewTest as test } from "./__fixture__";
test("6. 바깥 배경은 시트만 닫는다", async ({ page, previewData }) => {
  const card = page.locator(
    '.dashboard-card[data-tab-id="long-note"] .dashboard-card-open',
  );
  const sheet = page.locator(".dashboard-preview");
  const originalOverflow = await page
    .locator("body")
    .evaluate((el) => el.style.overflow);
  await card.tap();
  await expect(sheet).toBeVisible();
  await flickSheet(page, 35, 55);
  await page.evaluate(() => {
    document.addEventListener(
      "click",
      (event) => {
        if (event.isTrusted && event.detail > 0)
          event.stopImmediatePropagation();
      },
      true,
    );
  });
  await page.touchscreen.tap(5, 5);
  await expect(sheet).not.toBeVisible();
  await expect(page.locator("#dashboard-panel")).toBeVisible();
  await expect(page.locator(".pane-group textarea")).not.toBeVisible();
  await expect(card).toBeFocused();
  expect(await page.locator("body").evaluate((el) => el.style.overflow)).toBe(
    originalOverflow,
  );
  await card.tap();
  await expect(sheet).toBeVisible();
  await expect(sheet.locator("textarea")).toBeEditable();
  await expect(sheet.locator("textarea")).toHaveValue(previewData.long.content);
  await expect(sheet.locator("h2")).toHaveText(previewData.long.title);
});
