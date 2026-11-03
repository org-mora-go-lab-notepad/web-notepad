import { expect, test } from "@playwright/test";

import { DEFAULT_SETTINGS } from "@/src/4-entity/notepad";

import { createGroupFixture, createTabFixture } from "../../__fixture__";
import { dashboardColumn, openPanel, writeStoredState } from "../../__util__";

test("3. PC와 모바일에서 대시보드를 열 때 선택한 카드 위치를 복원하고 선택을 유지한다", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1280, height: 550 },
    { width: 390, height: 650 },
  ]) {
    await page.setViewportSize(viewport);
    const tabs = Array.from({ length: 24 }, (_, i) =>
      createTabFixture(
        "card-" + String(i).padStart(2, "0"),
        "Card " + String(i).padStart(2, "0"),
        { tabColor: "gray", dashboardStatus: "todo" },
      ),
    );
    await writeStoredState(page, {
      settings: DEFAULT_SETTINGS,
      activeGroupId: "ungrouped",
      groups: [
        createGroupFixture("ungrouped", "Ungrouped", tabs, {
          activeTabId: tabs.at(-1)!.id,
        }),
      ],
    });
    await openPanel(page, "dashboard-panel");
    const list = page.locator(".dashboard-list");
    const selected = dashboardColumn(page, "todo").locator(
      '.dashboard-card[data-tab-id="card-23"]',
    );
    await expect(selected.locator(".dashboard-card-open")).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect
      .poll(async () => {
        const item = (await selected.boundingBox())!,
          bounds = (await list.boundingBox())!;
        return (
          item.y >= bounds.y && item.y + item.height <= bounds.y + bounds.height
        );
      })
      .toBe(true);
    await list.evaluate((el) => {
      el.scrollTop = 0;
    });
    await dashboardColumn(page, "todo")
      .locator('.dashboard-card[data-tab-id="card-00"] .dashboard-card-open')
      .click();
    if (viewport.width <= 512) {
      await expect(page.locator("#dashboard-panel")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      await openPanel(page, "dashboard-panel");
    }
    await expect(
      dashboardColumn(page, "todo").locator(
        '.dashboard-card[data-tab-id="card-00"] .dashboard-card-open',
      ),
    ).toHaveAttribute("aria-current", "true");
    const firstSelected = dashboardColumn(page, "todo").locator(
      '.dashboard-card[data-tab-id="card-00"]',
    );
    await expect
      .poll(async () => {
        const item = (await firstSelected.boundingBox())!;
        const bounds = (await list.boundingBox())!;
        return (
          item.y >= bounds.y && item.y + item.height <= bounds.y + bounds.height
        );
      })
      .toBe(true);
    if (viewport.width > 512)
      await expect.poll(() => list.evaluate((el) => el.scrollTop)).toBe(0);
  }
});
