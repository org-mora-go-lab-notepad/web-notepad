import { expect, test } from "@playwright/test";

import { openAddTabCommand, readStoredState } from "../../__util__";

test.use({
  isMobile: true,
  hasTouch: true,
  viewport: { width: 390, height: 844 },
});

test("9. 모바일에서 카드 화면에서 새 탭을 누르면 새 탭 하나를 생성한다", async ({
  page,
}) => {
  await page.goto("/");
  const surface = await openAddTabCommand(page);
  await expect(page.locator(".initial-sync-lock")).toHaveCount(0);
  await expect(surface).toBeVisible();
  await expect(page.locator(".tab-item")).toHaveCount(0);
  await surface.tap();
  await expect(page.locator(".tab-item")).toHaveCount(1);
  const editor = page.locator("textarea:visible");
  await expect(editor).toHaveValue("");
  await expect(page.locator(".dashboard-preview")).toBeVisible();
  await editor.tap();
  await editor.fill("Mobile created note");
  await editor.tap();
  await expect(page.locator(".tab-item")).toHaveCount(1);
  const state = await readStoredState(page);
  expect(state.groups[0].tabs).toHaveLength(1);
  expect(state.groups[0].tabs[0].content).toBe("Mobile created note");
});
