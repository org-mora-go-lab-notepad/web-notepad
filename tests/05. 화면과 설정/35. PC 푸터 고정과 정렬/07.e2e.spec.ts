import { expect, test } from "@playwright/test";

import { createGroupFixture, createTabFixture } from "../../__fixture__";
import {
  authenticateBrowser,
  readStoredState,
  writeStoredState,
} from "../../__util__";
test("7. 오래된 서버 데이터에 푸터 설정이 없어도 로컬 고정 해제를 유지한다", async ({
  page,
  context,
}) => {
  await authenticateBrowser(context);
  const snapshot = {
    activeGroupId: "ungrouped",
    groups: [
      createGroupFixture("ungrouped", "Ungrouped", [
        createTabFixture("old-note", "Server note"),
      ]),
    ],
    closedTabs: [],
    settings: { fontScale: 0.9 },
    nextTabNumber: 2,
  };
  await page.route("**/api/notepad/history", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    await route.fulfill({
      json: {
        count: 1,
        latest: { eventId: "old-footer", snapshot: JSON.stringify(snapshot) },
      },
    });
  });
  await writeStoredState(page, {
    ...snapshot,
    settings: { footerItems: [], footerIconsOnly: true },
  });
  await expect(page.locator(".home")).toHaveAttribute("aria-busy", "false");
  await expect(
    page.locator(".footer-dock .footer-dock-item:visible"),
  ).toHaveCount(0);
  const state = await readStoredState(page);
  expect(state.settings?.footerItems).toEqual([]);
  expect(state.settings?.footerIconsOnly).toBe(true);
});
