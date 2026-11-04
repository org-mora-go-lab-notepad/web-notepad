import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import {
  activeTabItem,
  ensureEditorTab,
  expectSelectedLines,
  openBookmarksPanel,
  readStoredState,
  seedMoveGroupState,
  switchGroup,
} from "../../__util__";
import { moveTabToTarget } from "./__util__";

test("1. 그룹 이동 시 탭 ID, 내용, 색상, 고정, 줄 선택과 연결 북마크를 유지한다", async ({
  page,
}) => {
  const editor = page.locator("textarea:visible");
  const movedTabItem = activeTabItem(page);
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await seedMoveGroupState(page);
    if (viewport.width > 512) await expect(editor).toBeVisible();
    else
      await expect(page.locator(".dashboard-card-open").first()).toBeVisible();
    const original = await readStoredState(page);
    await moveTabToTarget(page, viewport);

    const moved = await readStoredState(page);
    expect(moved.groups[0].bookmarks).toEqual([]);
    expect(moved.groups[1].tabs.at(-1)).toEqual(original.groups[0].tabs[0]);
    expect(moved.groups[1].bookmarks).toEqual(original.groups[0].bookmarks);

    await switchGroup(page, "Target");
    await ensureEditorTab(page);
    await expect(editor).toHaveValue("Move me\nselected line");
    await expect(movedTabItem).not.toHaveClass(/is-pinned/);
    await expect(movedTabItem).toHaveClass(/is-bookmarked/);
    await expect(movedTabItem).toHaveAttribute("data-tab-color", "red");
    await expectSelectedLines(page, [false, true]);
    await openBookmarksPanel(page);
    await expect(page.locator("#bookmarks-panel strong")).toHaveText("Move me");
    await page.locator(".bookmark-item-open").click();
    await ensureEditorTab(page);
    await expect(page.locator(".tab-item")).toHaveCount(2);
    await expect(editor).toHaveValue("Move me\nselected line");
    if (
      (await page
        .locator(".group-select-command")
        .getAttribute("aria-expanded")) === "true"
    )
      await page.locator(".group-select-command").click();
  }
});
