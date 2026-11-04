import { expect } from "@playwright/test";

import { previewTest as test } from "../19. 모바일 카드 미리보기/__fixture__";
test("4. 모바일 그룹과 카드 아이콘은 현재 화면만 채워서 표시한다", async ({
  page,
  previewData,
}) => {
  const group = page.locator(".group-select-command");
  const card = page.locator(".dashboard-command");
  await expect(
    page.locator('.dashboard-card[data-tab-id="main-note"]'),
  ).toContainText(previewData.active.title);
  await expect(card).toHaveAttribute("aria-current", "page");
  await expect(group).not.toHaveClass(/is-active/);
  await expect(card.locator("svg")).not.toHaveCSS("fill", "none");
  await expect(group.locator("svg")).toHaveCSS("fill", "none");
  await group.click();
  await expect(page.locator(".group-sidebar-header > button")).toBeHidden();
  await expect(group).toHaveAttribute("aria-current", "page");
  await expect(card).not.toHaveClass(/is-active/);
  await expect(group.locator("svg")).not.toHaveCSS("fill", "none");
  await expect(card.locator("svg")).toHaveCSS("fill", "none");
  await card.click();
  await expect(page.locator("#groups-menu")).toHaveCount(0);
  await expect(card).toHaveAttribute("aria-current", "page");
  await expect(group).not.toHaveClass(/is-active/);
});
