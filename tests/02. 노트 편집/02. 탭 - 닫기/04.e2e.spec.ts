import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";
import { addTabButton, readStoredState } from "../../__util__";

test("4. 북마크된 탭도 가운데 클릭하면 북마크를 유지한 채 숨긴다", async ({
  page,
}) => {
  await openEditor(page);
  const tabs = page.locator(".tab-item");
  await page.locator("textarea").fill("bookmarked content");
  await tabs.first().getByRole("tab").click({ button: "right" });
  await page.getByRole("menuitem", { name: "Bookmark", exact: true }).click();
  await addTabButton(page).click();

  await tabs.first().getByRole("tab").click({ button: "middle" });
  await expect(tabs).toHaveCount(1);
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect
    .poll(async () => {
      const state = await readStoredState(page);
      const hiddenTab = state.groups[0].tabs.find(
        (tab) => tab.content === "bookmarked content",
      );
      return {
        open: hiddenTab?.open,
        bookmarked: hiddenTab?.bookmarked,
        bookmarkCount: state.groups[0].bookmarks.length,
        closedCount: state.closedTabs?.length,
      };
    })
    .toEqual({
      open: false,
      bookmarked: true,
      bookmarkCount: 1,
      closedCount: 0,
    });
});
