import { expect, test } from "@playwright/test";

import { openBookmarksPanel, openPanel } from "../../__util__";

test("2. 북마크 팝업은 기존 고정 대시보드와 작업 영역 너비를 보존한다", async ({
  page,
}) => {
  await page.goto("/");
  await openPanel(page, "dashboard-panel");
  const before = (await page.locator(".workspace").boundingBox())!.width;
  await page.locator(".group-select-command").click();
  await openBookmarksPanel(page);
  const widthWithMenu = (await page.locator(".workspace").boundingBox())!.width;
  const popup = (await page.locator("#bookmarks-panel").boundingBox())!;
  expect(popup.x + popup.width / 2).toBeCloseTo(
    page.viewportSize()!.width / 2,
    0,
  );
  const viewportHeight = page.viewportSize()!.height;
  const centeredTop = (viewportHeight - popup.height) / 2;
  const offset = Math.max(-80, 36 - centeredTop);
  expect(popup.y + popup.height / 2).toBeCloseTo(
    viewportHeight / 2 + offset,
    0,
  );
  await expect(page.locator("#dashboard-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  expect((await page.locator(".workspace").boundingBox())!.width).toBeCloseTo(
    widthWithMenu,
    0,
  );
  await page.keyboard.press("Escape");
  await expect(page.locator("#dashboard-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  expect((await page.locator(".workspace").boundingBox())!.width).toBeCloseTo(
    widthWithMenu,
    0,
  );
  expect(widthWithMenu).toBeLessThan(before);
});
