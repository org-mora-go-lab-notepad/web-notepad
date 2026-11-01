import { expect, test } from "@playwright/test";

import { createGroups } from "../../__util__";

test("1. PC 진입점을 푸터에 고정하고 드래그 정렬한 뒤 다시 해제한다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 844 });
  await page.goto("/");
  await createGroups(page, "Pinned Group");
  await page.locator(".group-select-command").click();
  const groupEntry = page
    .locator(".group-item")
    .getByRole("button", { name: "Pinned Group", exact: true });
  await groupEntry.click({ button: "right" });
  await expect(page.locator(".footer-pin-menu")).toHaveCount(0);
  await expect(
    page.locator(".group-action-dropdown [role=menuitem]"),
  ).toHaveText(["Close All", "Pin to footer", "Edit"]);
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
  await pinned.dragTo(page.locator('[data-footer-item="core:groups"]'));
  await expect(page.locator(".footer-dock-item").first()).toHaveAttribute(
    "data-footer-item",
    /group:/,
  );

  const storedOrder = await page
    .locator(".footer-dock-item")
    .evaluateAll((items) =>
      items.map((item) => item.getAttribute("data-footer-item")),
    );
  await page.reload();
  await expect(page.locator(".footer-dock-item").first()).toHaveAttribute(
    "data-footer-item",
    storedOrder[0]!,
  );

  await page
    .locator('[data-footer-item="core:groups"]')
    .click({ button: "right" });
  await expect(page.locator(".footer-pin-menu")).toHaveCount(0);
  await pinned.click({ button: "right" });
  await page.getByRole("menuitem", { name: "Unpin from footer" }).click();
  await expect(pinned).toHaveCount(0);
  await expect(page.locator(".footer-dock-item.is-core")).toHaveCount(3);
});
