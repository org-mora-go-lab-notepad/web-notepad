import { expect } from "@playwright/test";

import { previewTest as test } from "./__fixture__";
test("10. 상태 제목으로 목록을 접고 펼친다", async ({ page, previewData }) => {
  const card = page.locator(
    '.dashboard-card[data-tab-id="long-note"] .dashboard-card-open',
  );
  await expect(card.locator("strong")).toHaveText(previewData.long.title);
  const column = page.locator('.dashboard-column[data-status="ready"]');
  await column.locator(".dashboard-status-toggle").click();
  await expect(column.locator(".dashboard-cards")).toBeHidden();
  await expect(card).toBeHidden();
  await column.locator(".dashboard-status-toggle").click();
  await expect(column.locator(".dashboard-cards")).toBeVisible();
  await expect(column.locator(".dashboard-status-toggle")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(
    page.locator('.dashboard-card[data-tab-id="main-note"]'),
  ).toBeVisible();
});
