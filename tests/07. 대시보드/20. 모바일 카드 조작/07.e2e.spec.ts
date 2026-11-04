import { expect } from "@playwright/test";

import { previewTest as test } from "../19. 모바일 카드 미리보기/__fixture__";

test("7. 모바일 상태별 접기와 펼치기를 새로고침 뒤 복원한다", async ({
  page,
  previewData,
}) => {
  const column = page.locator('.dashboard-column[data-status="ready"]');
  const toggle = column.locator(".dashboard-status-toggle");
  const card = column.locator('.dashboard-card[data-tab-id="long-note"]');
  await expect(card).toContainText(previewData.long.title);
  await toggle.tap();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await page.reload();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(card).toBeHidden();
  await toggle.tap();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.reload();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(card).toBeVisible();
});
