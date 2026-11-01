import { expect, test } from "@playwright/test";

import {
  openBookmarksPanel,
  switchGroup,
  writeStoredState,
} from "../../__util__";
import { createBookmarkGroupsState } from "./__fixture__";

test("6. More의 Bookmark는 모든 그룹의 북마크 내용을 표시한다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await writeStoredState(page, createBookmarkGroupsState());
  await openBookmarksPanel(page);

  const items = page.locator("#bookmarks-panel .bookmark-item");
  await expect(items).toHaveCount(2);
  await expect(items.nth(0).locator("strong")).toHaveText("Work note");
  await expect(items.nth(0).locator(".bookmark-item-group")).toHaveText("Work");
  await expect(items.nth(0).locator(".bookmark-item-content")).toHaveText(
    "Work content",
  );
  await expect(items.nth(1).locator("strong")).toHaveText("Home note");
  await expect(items.nth(1).locator(".bookmark-item-group")).toHaveText(
    "Ungrouped",
  );
  await expect(items.nth(1).locator(".bookmark-item-content")).toHaveText(
    "Home content",
  );
  const bookmarkCard = items.first();
  const bookmarkStyles = await bookmarkCard.evaluate((element) => {
    const title = element.querySelector("strong")!;
    const group = element.querySelector(".bookmark-item-group")!;
    const preview = element.querySelector(".bookmark-item-content")!;
    const read = (target: Element) => {
      const style = getComputedStyle(target);
      return {
        color: style.color,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
      };
    };
    return {
      maxHeight: getComputedStyle(element).maxHeight,
      title: read(title),
      group: read(group),
      preview: read(preview),
    };
  });
  expect(bookmarkStyles.maxHeight).toBe("216px");
  await page.locator("#bookmarks-panel .corner-popover-close").click();
  await switchGroup(page, "All Group");
  await page.locator(".dashboard-command").click();
  const dashboardCard = page.locator(".dashboard-card").first();
  await expect(dashboardCard).toBeVisible();
  await expect(dashboardCard).toHaveCSS("max-height", "216px");
  for (const [bookmarkStyle, selector] of [
    [bookmarkStyles.title, ".dashboard-card-open strong"],
    [bookmarkStyles.group, ".dashboard-card-group"],
    [bookmarkStyles.preview, ".dashboard-card-preview"],
  ] as const) {
    const dashboardStyle = await dashboardCard
      .locator(selector)
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          color: style.color,
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
        };
      });
    expect(bookmarkStyle).toEqual(dashboardStyle);
  }
});
