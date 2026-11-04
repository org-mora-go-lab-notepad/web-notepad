import { expect, test } from "@playwright/test";

import { createGroupFixture, createTabFixture } from "../../__fixture__";
import { seedStoredStateOnLoad, swipeTouch } from "../../__util__";
test.use({
  isMobile: true,
  hasTouch: true,
  viewport: { width: 390, height: 844 },
});
test("7. 모바일 그룹과 카드를 다시 눌러도 메인 편집기를 노출하지 않는다", async ({
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
  const dashboard = page.locator("#dashboard-panel");
  await expect(dashboard).toHaveAttribute("aria-hidden", "false");
  const footer = page.locator(".footer");
  await swipeTouch(footer, "left");
  await expect(page.locator(".pane-group textarea")).not.toBeVisible();
  await footer.locator(".dashboard-command").tap();
  await expect(dashboard).toHaveAttribute("aria-hidden", "false");
  await footer.locator(".group-select-command").tap();
  await expect(page.locator("#groups-menu")).toBeVisible();
  await footer.locator(".group-select-command").tap();
  await expect(page.locator("#groups-menu")).toHaveCount(0);
  await expect(dashboard).toBeVisible();
  await expect(page.locator(".pane-group textarea")).not.toBeVisible();
});
