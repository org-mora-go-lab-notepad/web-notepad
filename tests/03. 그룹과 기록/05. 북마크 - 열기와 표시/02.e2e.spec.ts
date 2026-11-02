import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";
import {
  addTabButton,
  bookmarkActiveTab,
  openBookmarksPanel,
} from "../../__util__";

test("2. 원본 탭이 남아 있는 북마크를 열면 해당 탭을 활성화한다", async ({
  page,
}) => {
  await openEditor(page);
  await bookmarkActiveTab(page, "bookmark source");
  await addTabButton(page).click();
  await page.locator("textarea").fill("other note");

  await openBookmarksPanel(page);
  await page.locator(".bookmark-item-open").click();

  await expect(page.locator("textarea")).toHaveValue("bookmark source");
});
