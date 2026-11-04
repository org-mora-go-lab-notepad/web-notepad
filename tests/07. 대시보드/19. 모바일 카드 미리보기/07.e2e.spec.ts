import { expect } from "@playwright/test";

import { previewTest as test } from "./__fixture__";
test("7. 줄 번호를 선택한다", async ({ page, previewData }) => {
  const card = page.locator(
    '.dashboard-card[data-tab-id="long-note"] .dashboard-card-open',
  );
  const sheet = page.locator(".dashboard-preview");
  await card.click();
  const line = sheet.locator('.line-rail [role="button"]').first();
  await line.click();
  await expect(line).toHaveAttribute("aria-pressed", "true");
  await line.click();
  await expect(line).toHaveAttribute("aria-pressed", "false");
  const second = sheet.locator('.line-rail [role="button"]').nth(1);
  await second.click();
  await expect(second).toHaveAttribute("aria-pressed", "true");
  await expect(sheet.locator("textarea")).toHaveValue(previewData.long.content);
  await expect(line).not.toHaveClass(/is-selected/);
  await expect(second).toHaveClass(/is-selected/);
});
