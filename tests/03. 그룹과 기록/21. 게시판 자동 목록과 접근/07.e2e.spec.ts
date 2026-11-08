import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import { openMoreMenu, writeStoredState } from "../../__util__";

test("7. 비로그인 사용자의 메뉴와 푸터에 Board를 표시하지 않는다", async ({
  page,
}) => {
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await writeStoredState(page, {
      settings: { footerItems: ["account:board"] },
    });
    const menu = await openMoreMenu(page);
    await expect(
      menu.getByRole("button", { name: "Board", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.locator('[data-footer-item="account:board"]'),
    ).toHaveCount(0);
    await expect(
      menu.getByRole("button", { name: "Guide", exact: true }),
    ).toBeVisible();
    await expect(page.locator("a.auth-command")).toBeVisible();
  }
});
