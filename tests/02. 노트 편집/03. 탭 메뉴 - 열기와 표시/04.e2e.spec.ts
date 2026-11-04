import { expect, test } from "@playwright/test";

import { MOBILE_VIEWPORT } from "../../__constant__";
import { openEditor } from "../../__util__";
import { closeMobileEditor } from "../../__util__";

test.use({ hasTouch: true });

test("4. 모바일 탭 카드을 더블탭해 북마크 상태를 전환한다", async ({
  page,
}) => {
  await page.setViewportSize(MOBILE_VIEWPORT);
  await openEditor(page);
  await page.locator(".dashboard-preview textarea").fill("Mobile card");
  await closeMobileEditor(page);
  const tab = page.locator(".dashboard-card").first();
  const button = tab.locator(".dashboard-card-open");

  await button.dblclick();
  await page.getByRole("menuitem", { name: "Bookmark", exact: true }).tap();
  await expect(tab.locator(".dashboard-card-bookmark")).toBeVisible();
  await button.dblclick();
  await page
    .getByRole("menuitem", { name: "Remove bookmark", exact: true })
    .tap();
  await expect(tab.locator(".dashboard-card-bookmark")).toHaveCount(0);
});
