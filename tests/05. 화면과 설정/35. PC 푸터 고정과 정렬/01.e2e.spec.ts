import { expect, test } from "@playwright/test";

import { createGroupsWithTabs } from "../../__util__";

test("1. PC 진입점을 푸터에 고정하고 중복 고정 없이 다시 해제한다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 844 });
  await page.goto("/");
  await createGroupsWithTabs(page, "Pinned Group");
  await page.locator(".group-select-command").click();
  const groupEntry = page
    .locator(".group-item")
    .getByRole("button", { name: "Pinned Group", exact: true });
  await groupEntry.click({ button: "right" });
  await expect(page.locator(".footer-pin-menu")).toHaveCount(0);
  await expect(
    page.locator(".group-action-dropdown [role=menuitem]"),
  ).toHaveText(["Pin to footer"]);
  await page.getByRole("menuitem", { name: "Pin to footer" }).click();

  const pinned = page.locator('.footer-dock-item[data-footer-item^="group:"]');
  await expect(pinned).toHaveCount(1);
  await groupEntry.click({ button: "right" });
  await expect(
    page.getByRole("menuitem", { name: "Pin to footer" }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(
    pinned.getByRole("button", { name: "Pinned Group" }),
  ).toBeVisible();
  await page
    .locator('[data-footer-item="core:groups"]')
    .click({ button: "right" });
  await expect(page.locator(".footer-pin-menu")).toHaveCount(0);
  await pinned.click({ button: "right" });
  await page.getByRole("menuitem", { name: "Unpin from footer" }).click();
  await expect(pinned).toHaveCount(0);
  await expect(page.locator(".footer-dock-item.is-core")).toHaveCount(3);
});
