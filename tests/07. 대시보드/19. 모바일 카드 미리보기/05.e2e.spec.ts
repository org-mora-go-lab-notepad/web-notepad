import { expect } from "@playwright/test";

import { previewTest as test } from "./__fixture__";
import { previewCard, previewSheet } from "./__util__";

test("5. 모바일 뒤로가기는 먼저 미리보기만 닫고 다음 뒤로가기에 카드 패널을 닫는다", async ({
  page,
  previewData,
}) => {
  const panel = page.locator("#dashboard-panel");
  const href = page.url();
  const history = await page.evaluate(() => window.history.length);
  await previewCard(page, previewData.closed.id).tap();
  await expect(previewSheet(page)).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.history.length))
    .toBe(history + 1);
  expect(page.url()).toBe(href);
  await page.goBack();
  await expect(previewSheet(page)).toHaveCount(0);
  await expect(panel).toHaveAttribute("aria-hidden", "false");
  await expect(page.locator("textarea")).toHaveValue(
    previewData.active.content,
  );
  await page.goBack();
  await expect(panel).toHaveAttribute("aria-hidden", "true");
  await expect(previewSheet(page)).toHaveCount(0);
  expect(page.url()).not.toContain("panel=dashboard");
});
