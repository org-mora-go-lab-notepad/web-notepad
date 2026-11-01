import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import { createGroupFixture, createTabFixture } from "../../__fixture__";
import { openMoreMenu, seedStoredStateOnLoad } from "../../__util__";

test("6. UI 문구의 선택을 막고 입력과 본문 복사를 위한 선택은 유지한다", async ({
  page,
}) => {
  await seedStoredStateOnLoad(page, {
    groups: [
      createGroupFixture(
        "ungrouped",
        "Ungrouped",
        [createTabFixture("tab-1", "Note")],
        {
          bookmarks: [
            {
              id: "bookmark-1",
              sourceTabId: "saved-tab",
              title: "Saved note",
              content: "Selectable note",
              tabColor: "gray",
              selectedLines: [],
              createdAt: 1,
              updatedAt: 1,
            },
          ],
        },
      ),
    ],
  });
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await openMoreMenu(page);
    await expect(page.locator(".global-search-command")).toHaveCSS(
      "user-select",
      "none",
    );
    const editor = page.locator("textarea").first();
    await expect(editor).toHaveCSS("user-select", "text");
    await editor.fill("Selectable note");
    await editor.selectText();
    expect(
      await editor.evaluate((element: HTMLTextAreaElement) =>
        element.value.slice(element.selectionStart, element.selectionEnd),
      ),
    ).toBe("Selectable note");
    await page.locator(".footer .global-search-command").click();
    const dialog = page.getByRole("dialog");
    const input = dialog.getByRole("searchbox");
    await expect(input).toHaveCSS("user-select", "text");
    await input.fill("Selectable");
    await dialog
      .getByRole("button", { name: "Preview bookmark Saved note", exact: true })
      .click();
    await expect(dialog.locator("pre")).toHaveCSS("user-select", "text");
    await page.keyboard.press("Escape");
  }
});
