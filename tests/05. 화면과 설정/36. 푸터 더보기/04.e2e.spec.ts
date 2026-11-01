import { expect, test } from "@playwright/test";

import { createGroupFixture, createTabFixture } from "../../__fixture__";
import { seedStoredStateOnLoad, swipeTouch } from "../../__util__";

test.use({
  isMobile: true,
  hasTouch: true,
  viewport: { width: 390, height: 844 },
});

test("4. 모바일 스와이프 이후 더보기와 검색을 첫 터치로 연다", async ({
  page,
}) => {
  await seedStoredStateOnLoad(page, {
    groups: [
      createGroupFixture("ungrouped", "Ungrouped", [
        createTabFixture("tab-1", "First note"),
        createTabFixture("tab-2", "Second note"),
      ]),
    ],
  });
  await expect(page.locator("textarea")).toHaveValue("First note");
  await expect(page.locator(".home")).toHaveAttribute("aria-busy", "false");
  const footer = page.locator(".footer");
  await expect(footer).toHaveAttribute("data-swipe-tabs", "true");
  await swipeTouch(footer, "left");
  await expect(page.locator("textarea")).toHaveValue("Second note");
  await footer.locator(".more-command").tap();
  const menu = page.locator("#group-more-menu");
  await expect(menu).toBeVisible();
  await menu.getByRole("button", { name: "Search", exact: true }).tap();
  await expect(page.locator("#global-search-popup")).toBeVisible();
  await expect(menu).toHaveCount(0);
  await expect(page.locator("textarea")).toHaveValue("Second note");
  await expect(page.locator("textarea")).not.toBeFocused();
});
