import { expect, test } from "@playwright/test";

import {
  dashboardColumn,
  dashboardPanel,
  seedScrollableDashboard,
} from "../../__util__";

test("5. 모바일에서 위로 스크롤하면 To Do·Ready·Doing를 다시 상단에 고정한다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await seedScrollableDashboard(page);
  const panel = dashboardPanel(page);
  const headerBox = (await panel.locator(".side-panel-header").boundingBox())!;
  const stickyY = headerBox.y + headerBox.height;

  await panel
    .locator('.dashboard-column-status[data-status="done"]')
    .evaluate((element) => element.scrollIntoView({ block: "start" }));
  for (const status of ["todo", "ready", "in-progress"] as const) {
    await dashboardColumn(page, status)
      .locator(".dashboard-cards")
      .evaluate((element) => element.scrollIntoView({ block: "start" }));
    const title = panel.locator(
      `.dashboard-column-status[data-status="${status}"]`,
    );
    expect((await title.boundingBox())!.y).toBeCloseTo(stickyY, 0);
  }
});
