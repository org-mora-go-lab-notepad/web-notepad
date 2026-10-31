import { expect, test } from "@playwright/test";

import {
  createGroupFixture,
  createTabFixture,
  signedSession,
} from "../../__fixture__";
import {
  authenticateBrowser,
  seedStoredStateOnLoad,
  swipeTouch,
} from "../../__util__";

test.use({
  isMobile: true,
  hasTouch: true,
  viewport: { width: 390, height: 844 },
});

test("8. 푸터 스와이프 직후 메뉴·대시보드·사용자 아이콘이 첫 탭으로 동작한다", async ({
  page,
  context,
}) => {
  await authenticateBrowser(
    context,
    signedSession({
      id: "footer-swipe-user",
      nickname: "Footer User",
      expiresAt: Date.now() + 300_000,
    }),
  );
  await seedStoredStateOnLoad(page, {
    groups: [
      createGroupFixture("ungrouped", "Ungrouped", [
        createTabFixture("tab-1", "First note"),
        createTabFixture("tab-2", "Second note"),
      ]),
    ],
  });
  const footer = page.locator(".footer");
  const menu = footer.locator(".group-select-command");
  const dashboard = footer.locator(".dashboard-command");
  const account = footer.locator("button.auth-command");
  const compatibilityClick = (target: typeof menu) =>
    target.evaluate((element) => {
      const event = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        detail: 1,
      });
      Object.defineProperty(event, "sourceCapabilities", {
        value: { firesTouchEvents: true },
      });
      return element.dispatchEvent(event);
    });
  await expect(footer.locator(".auth-command:not(.is-loading)")).toBeVisible();
  await expect(page.locator("textarea")).toHaveValue("First note");
  await expect(footer).toHaveAttribute("data-swipe-tabs", "true");
  await swipeTouch(footer, "left");
  await expect(page.locator("textarea")).toHaveValue("Second note");
  await expect(page.locator("#dashboard-panel")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await compatibilityClick(menu);
  await expect(page.locator("#groups-menu")).toHaveCount(0);

  await menu.tap();

  await expect(page.locator("#groups-menu")).toBeVisible();
  await menu.tap();
  await expect(page.locator("#groups-menu")).toHaveCount(0);

  await swipeTouch(footer, "right");
  await expect(page.locator("textarea")).toHaveValue("First note");
  await compatibilityClick(dashboard);
  await expect(page.locator("#dashboard-panel")).toHaveAttribute(
    "aria-hidden",
    "true",
  );

  await dashboard.tap();

  await expect(page.locator("#groups-menu")).toHaveCount(0);
  await expect(page.locator("#dashboard-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  await dashboard.tap();
  await expect(page.locator("#dashboard-panel")).toHaveAttribute(
    "aria-hidden",
    "true",
  );

  await swipeTouch(footer, "left");
  await expect(page.locator("textarea")).toHaveValue("Second note");
  await compatibilityClick(account);
  await expect(page.locator("#account-menu")).toHaveCount(0);

  await account.tap();
  await expect(page.locator("#account-menu")).toBeVisible();
  await account.tap();
  await expect(page.locator("#account-menu")).toHaveCount(0);
});
