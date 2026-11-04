import { expect } from "@playwright/test";

import { previewTest as test } from "../19. 모바일 카드 미리보기/__fixture__";
test("1. 모바일 헤더는 닫기를 숨기고 오른쪽 옵션 맨 위에 Add Tab을 제공한다", async ({
  page,
  previewData,
}) => {
  const panel = page.locator("#dashboard-panel");
  await expect(
    panel.getByRole("heading", { name: "Ungrouped", exact: true }),
  ).toBeVisible();
  await expect(panel.locator(".side-panel-close")).toBeHidden();
  await expect(
    panel.locator(".side-panel-header .dashboard-add-tab"),
  ).toHaveCount(0);
  const options = panel.locator(".dashboard-options-trigger");
  const header = (await panel.locator(".side-panel-header").boundingBox())!;
  const button = (await options.boundingBox())!;
  expect(header.x + header.width - button.x - button.width).toBeLessThanOrEqual(
    24,
  );
  await options.click();
  const menu = page.locator("#dashboard-options-menu");
  await expect(menu.getByRole("button").first()).toHaveText("Add Tab");
  await menu.getByRole("button", { name: "Add Tab", exact: true }).click();
  await expect(menu).toBeHidden();
  await expect(page.locator(".dashboard-preview textarea")).toBeEditable();
  await page
    .locator(".dashboard-preview textarea")
    .fill("Created from options");
  await expect(page.locator(".dashboard-preview h2")).toHaveText(
    "Created from options",
  );
  await page.locator(".bottom-sheet-header button").click();
  await expect(options).toBeFocused();
  await expect(
    page.locator('.dashboard-card[data-tab-id="long-note"]'),
  ).toContainText(previewData.long.title);
});
