import { expect, test } from "@playwright/test";

import { MOBILE_VIEWPORT } from "../../__constant__";
import { openEditor } from "../../__util__";
import { authenticateBrowser } from "../../__util__";

test.use({ hasTouch: true, isMobile: true, viewport: MOBILE_VIEWPORT });

test("5. 모바일 탭 헤더 메뉴 글자를 계정 드롭다운과 같은 크기로 표시한다", async ({
  page,
  context,
}) => {
  await authenticateBrowser(context);
  await openEditor(page);
  const account = page.locator("button.auth-command:not(.is-loading)");
  await expect(account).toBeVisible();
  await account.tap();
  const accountFontSize = await page
    .locator(".auth-menu [role='menuitem']")
    .first()
    .evaluate((element) => getComputedStyle(element).fontSize);
  await page.keyboard.press("Escape");

  await page.locator(".tab-item").first().getByRole("tab").dblclick();
  const tabMenuItem = page
    .getByRole("menu", { name: "Tab actions" })
    .getByRole("menuitem")
    .first();
  await expect(tabMenuItem).toBeVisible();
  await expect(tabMenuItem).toHaveCSS("font-size", accountFontSize);
});
