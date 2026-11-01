import { expect, test } from "@playwright/test";

import { createGroupFixture, createTabFixture } from "../../__fixture__";
import { openBoard, seedStoredStateOnLoad } from "../../__util__";

test("6. 보드 Notes는 다섯 상태의 카드 전체를 합산한다", async ({ page }) => {
  await seedStoredStateOnLoad(page, {
    activeGroupId: "count-group",
    groups: [
      createGroupFixture(
        "count-group",
        "All status count",
        [
          createTabFixture("note", "N", { dashboardStatus: "icebox" }),
          createTabFixture("todo", "Todo note", { dashboardStatus: "todo" }),
          createTabFixture("ready", "Ready note", { dashboardStatus: "ready" }),
          createTabFixture("doing", "Doing note", {
            dashboardStatus: "in-progress",
            open: false,
          }),
          createTabFixture("done", "Done note", {
            dashboardStatus: "done",
            open: false,
          }),
          createTabFixture("empty", ""),
        ],
        { dashboardVisibility: { icebox: true, done: true } },
      ),
    ],
  });
  await page.locator(".dashboard-command").click();
  await expect(page.locator(".dashboard-card")).toHaveCount(5);
  await openBoard(page);
  const row = page.locator('.board-entry[data-group-id="local-count-group"]');
  await expect(row).toBeVisible();
  await expect(
    row.locator("xpath=ancestor::tr").locator("td").nth(1),
  ).toHaveText("5");
  await row.click();
  const metric = page
    .locator(".board-meta > span")
    .filter({ has: page.locator("small", { hasText: /^Notes$/ }) });
  await expect(metric.locator("strong")).toHaveText("5");
  await expect(page.locator(".board-detail")).toBeVisible();
});
