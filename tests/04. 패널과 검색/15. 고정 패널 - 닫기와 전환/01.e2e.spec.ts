import { expect, test } from "@playwright/test";

import { DESKTOP_VIEWPORT } from "../../__constant__";
import { openMoreMenu, openPanel } from "../../__util__";

test("1. Bookmark 모달을 닫은 뒤 More의 Bookmark 명령으로 다시 연다", async ({
  page,
}) => {
  await page.setViewportSize(DESKTOP_VIEWPORT);
  await page.goto("/");
  await openPanel(page, "bookmarks-panel");
  await page.keyboard.press("Escape");
  await expect(page.locator("#bookmarks-panel")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  const menu = await openMoreMenu(page);
  await menu.getByRole("button", { name: /Bookmark|북마크/i }).click();
  await expect(page.locator("#bookmarks-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
});
