import { expect, test } from "@playwright/test";

import { MOBILE_VIEWPORT } from "../../__constant__";
import { openEditor } from "../../__util__";
import { closeMobileEditor } from "../../__util__";

test.use({ hasTouch: true });

test("3. 모바일 탭 카드 더블탭 메뉴에 Pin·Unpin을 표시하지 않는다", async ({
  page,
}) => {
  await page.setViewportSize(MOBILE_VIEWPORT);
  await openEditor(page);
  await page.locator(".dashboard-preview textarea").fill("Mobile card");
  await closeMobileEditor(page);
  const tab = page.locator(".dashboard-card").first();
  const button = tab.locator(".dashboard-card-open");

  await button.dblclick();
  await expect(
    page.getByRole("menuitem", { name: "Pin", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("menuitem", { name: "Unpin", exact: true }),
  ).toHaveCount(0);
});
