import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";
import {
  activeTabItem,
  bookmarkActiveTab,
  closeActiveTab,
  cycleActiveTabColor,
  expectSelectedLines,
  lineButtons,
  openBookmarksPanel,
} from "../../__util__";

test("3. 원본 탭이 없는 북마크를 열면 탭 상태를 복원한다", async ({ page }) => {
  await openEditor(page);
  await bookmarkActiveTab(page, "restored bookmark\nsecond\nthird");
  await cycleActiveTabColor(page, 2);
  await lineButtons(page).nth(1).click();
  await lineButtons(page).nth(2).click();
  await closeActiveTab(page);

  await expect(page.locator("textarea")).toHaveCount(0);
  await page.reload();
  await openBookmarksPanel(page);
  await page.locator(".bookmark-item-open").click();

  await expect(page.locator("textarea")).toHaveValue(
    "restored bookmark\nsecond\nthird",
  );
  await expect(activeTabItem(page)).toHaveAttribute("data-tab-color", "indigo");
  await expectSelectedLines(page, [false, true, true]);
});
