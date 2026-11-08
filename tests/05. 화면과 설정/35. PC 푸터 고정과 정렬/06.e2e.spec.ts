import { expect, test } from "@playwright/test";

import {
  authenticateBrowser,
  openMoreMenu,
  writeStoredState,
} from "../../__util__";

test.use({
  isMobile: true,
  hasTouch: true,
  viewport: { width: 390, height: 844 },
});

test("6. PC의 모든 고정 해제 설정이 있어도 모바일 기본 푸터는 유지한다", async ({
  page,
}) => {
  await authenticateBrowser(page.context());
  await writeStoredState(page, { settings: { footerItems: [] } });
  const group = page.locator(".footer-dock .group-select-command");
  const card = page.locator(".footer-dock .dashboard-command");
  await expect(group).toBeVisible();
  await expect(card).toBeVisible();
  await expect(page.locator(".footer-dock .auth-command")).toBeVisible();
  await group.tap();
  await expect(page.locator("#groups-menu")).toBeVisible();
  await card.tap();
  await expect(page.locator("#dashboard-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  const menu = await openMoreMenu(page);
  await expect(
    menu.getByRole("button", { name: "Group", exact: true }),
  ).toHaveCount(0);
  await expect(
    menu.getByRole("button", { name: "Card", exact: true }),
  ).toHaveCount(0);
  await expect(menu.locator(".footer-unpinned-account")).toBeHidden();
  await expect(
    menu.getByRole("button", { name: "Board", exact: true }),
  ).toBeVisible();
  await menu.getByRole("switch", { name: "Theme" }).focus();
  await page.keyboard.press("End");
  await expect(
    menu.getByRole("button", { name: "Board", exact: true }),
  ).toBeFocused();
  await expect(page.locator(".footer")).toBeVisible();
});
