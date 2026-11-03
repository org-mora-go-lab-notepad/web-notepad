import { expect } from "@playwright/test";

import { previewTest as test } from "./__fixture__";
import { previewCard, previewSheet } from "./__util__";

test("6. 미리보기 바깥 배경을 터치하면 시트만 닫고 다음 카드를 바로 읽는다", async ({
  page,
  previewData,
}) => {
  await previewCard(page, previewData.closed.id).tap();
  const sheet = previewSheet(page);
  await expect(sheet).toBeVisible();
  const bounds = (await sheet.boundingBox())!;
  expect(bounds.y).toBeGreaterThan(30);
  await page.touchscreen.tap(20, bounds.y - 20);
  await expect(sheet).toHaveCount(0);
  await expect(page.locator("#dashboard-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  await previewCard(page, previewData.long.id).tap();
  await expect(sheet).toBeVisible();
  await expect(sheet.locator("h2")).toHaveText(previewData.long.title);
  await sheet
    .getByRole("button", { name: "Close tab preview", exact: true })
    .tap();
  await expect(sheet).toHaveCount(0);
  await expect(page.locator("textarea")).toHaveValue(
    previewData.active.content,
  );
});
