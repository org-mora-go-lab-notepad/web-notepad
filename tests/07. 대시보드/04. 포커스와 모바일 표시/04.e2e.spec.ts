import { expect, test } from "@playwright/test";

import { dashboardPanel, seedScrollableDashboard } from "../../__util__";

test("4. 모바일에서 아래로 스크롤하면 Waiting, In Progress, Done, Closed를 차례로 상단에 고정한다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await seedScrollableDashboard(page);
  const panel = dashboardPanel(page);
  const titles = {
    ready: panel.locator('.dashboard-column-status[data-status="ready"]'),
    todo: panel.locator('.dashboard-column-status[data-status="todo"]'),
    doing: panel.locator('.dashboard-column-status[data-status="in-progress"]'),
    done: panel.locator('.dashboard-column-status[data-status="done"]'),
  };
  const headerBox = (await panel.locator(".side-panel-header").boundingBox())!;
  const initialY = headerBox.y + headerBox.height + 20;
  const stickyY = headerBox.y + headerBox.height;

  const list = panel.locator(".dashboard-list");
  await list.evaluate((element) => {
    element.scrollTop = 0;
  });
  await expect
    .poll(async () => (await titles.todo.boundingBox())!.y)
    .toBeCloseTo(initialY, 0);
  for (const title of [titles.todo, titles.ready, titles.doing, titles.done]) {
    await title.evaluate((element) =>
      element.scrollIntoView({ block: "start" }),
    );
    expect((await title.boundingBox())!.y).toBeCloseTo(stickyY, 0);
  }
});
