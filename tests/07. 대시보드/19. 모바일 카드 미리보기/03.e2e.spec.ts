import { expect } from "@playwright/test";

import { previewTest as test } from "./__fixture__";
import { previewCard, previewSheet } from "./__util__";

test("3. 긴 미리보기 본문은 시트 내부에서 끝까지 스크롤하며 카드 목록을 움직이지 않는다", async ({
  page,
  previewData,
}) => {
  await previewCard(page, previewData.long.id).tap();
  const sheet = previewSheet(page);
  await expect(sheet).toBeVisible();
  const viewport = page.viewportSize()!;
  const bounds = (await sheet.boundingBox())!;
  expect(bounds.x).toBe(0);
  expect(bounds.width).toBe(viewport.width);
  expect(bounds.y + bounds.height).toBeCloseTo(viewport.height, 0);
  const list = page.locator(".dashboard-list");
  const before = await list.evaluate((el) => el.scrollTop);
  const content = sheet.locator(".bottom-sheet-content");
  expect(
    await content.evaluate((el) => el.scrollHeight > el.clientHeight),
  ).toBe(true);
  await content.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  expect(
    await content.evaluate((el) =>
      Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight),
    ),
  ).toBeLessThanOrEqual(1);
  await expect(sheet.locator("pre")).toContainText("마지막 줄 END");
  expect(await list.evaluate((el) => el.scrollTop)).toBe(before);
  await expect(content).toHaveCSS("overscroll-behavior-y", "contain");
});
