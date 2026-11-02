import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS, DESKTOP_VIEWPORT } from "../../__constant__";
import { openEditor } from "../../__util__";
import {
  bookmarkActiveTab,
  createGroupsWithTabs,
  openBookmarksPanel,
  openShortcutsPanel,
  readStoredState,
} from "../../__util__";

test("5. Escape로 북마크 팝업을 닫고 메모·그룹·북마크 데이터를 유지한다", async ({
  page,
}) => {
  await openEditor(page);
  const note = "Preserve this note";
  await createGroupsWithTabs(page, "Work");
  await bookmarkActiveTab(page, note);
  const editor = page.locator("textarea");
  const bookmarksPanel = page.locator("#bookmarks-panel");
  const bookmarkAction = bookmarksPanel.locator(".bookmark-item-open");
  const shortcutsPanel = page.locator("#shortcuts-panel");

  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);

    await openBookmarksPanel(page);
    await expect(bookmarksPanel).toHaveAttribute("aria-hidden", "false");
    await bookmarkAction.focus();
    await expect(bookmarkAction).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(bookmarksPanel).toHaveAttribute("aria-hidden", "true");
    await expect(editor).toHaveValue(note);

    if (viewport === DESKTOP_VIEWPORT) {
      await openShortcutsPanel(page);
      await expect(shortcutsPanel).toHaveAttribute("aria-hidden", "false");
      await page.keyboard.press("Escape");
      await shortcutsPanel.locator(".side-panel-close").click();
      await expect(shortcutsPanel).toHaveAttribute("aria-hidden", "true");
      await expect(editor).toHaveValue(note);
    }
  }

  const { groups } = await readStoredState(page);
  const work = groups.find((group) => group.name === "Work")!;
  expect({
    groups: groups.map((group) => group.name),
    content: work.tabs[0].content,
    bookmarks: work.bookmarks.map((bookmark) => bookmark.content),
  }).toEqual({
    groups: ["Ungrouped", "Work"],
    content: note,
    bookmarks: [note],
  });
});
