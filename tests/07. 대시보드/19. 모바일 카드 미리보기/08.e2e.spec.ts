import { expect } from "@playwright/test";

import { previewTest as test } from "./__fixture__";
import { previewCard, previewSheet } from "./__util__";

test("8. PC 너비로 전환하면 시트를 정리하고 모바일 복귀 시 예전 시트를 다시 열지 않는다", async ({
  page,
  previewData,
}) => {
  await previewCard(page, previewData.long.id).tap();
  await expect(previewSheet(page)).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(previewSheet(page)).toHaveCount(0);
  await expect(page.locator("#dashboard-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  await expect(page.locator("textarea")).toHaveValue(
    previewData.active.content,
  );
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
    "hidden",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(previewSheet(page)).toHaveCount(0);
  await previewCard(page, previewData.closed.id).tap();
  await expect(previewSheet(page)).toBeVisible();
  await expect(previewSheet(page).locator("h2")).toHaveText(
    previewData.closed.title,
  );
  await previewSheet(page)
    .getByRole("button", { name: "Close tab preview", exact: true })
    .tap();
  await expect(previewSheet(page)).toHaveCount(0);
});
