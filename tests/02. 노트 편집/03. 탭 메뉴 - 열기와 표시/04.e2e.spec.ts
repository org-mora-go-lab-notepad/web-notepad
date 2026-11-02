import { expect, test } from "@playwright/test";

import { MOBILE_VIEWPORT } from "../../__constant__";
import { openEditor } from "../../__util__";
import { addTabButton } from "../../__util__";

test.use({ hasTouch: true });

test("4. 모바일 탭 제목을 더블탭해 북마크 상태를 전환한다", async ({
  page,
}) => {
  await page.setViewportSize(MOBILE_VIEWPORT);
  await openEditor(page);
  await addTabButton(page).tap();
  const tab = page.locator(".tab-item").first();
  const button = tab.getByRole("tab");

  await button.dblclick();
  await page.getByRole("menuitem", { name: "Bookmark", exact: true }).tap();
  await expect(tab).toHaveClass(/is-bookmarked/);
  await button.dblclick();
  await page
    .getByRole("menuitem", { name: "Remove bookmark", exact: true })
    .tap();
  await expect(tab).not.toHaveClass(/is-bookmarked/);
});
