import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import { createGroupFixture, createTabFixture } from "../../__fixture__";
import { dashboardColumn, openPanel, writeStoredState } from "../../__util__";
test("1. 카드 상태는 PC 기존 순서와 모바일 Doing Ready To Do Done Note 순서로 표시한다", async ({
  page,
}) => {
  await writeStoredState(page, {
    activeGroupId: "ungrouped",
    groups: [
      createGroupFixture(
        "ungrouped",
        "Ungrouped",
        [
          createTabFixture("note", "Note card", { dashboardStatus: "icebox" }),
          createTabFixture("todo", "Todo card", { tabColor: "gray" }),
          createTabFixture("ready", "Ready card", {
            tabColor: "orange",
            dashboardStatus: "ready",
          }),
          createTabFixture("doing", "Doing card", { tabColor: "indigo" }),
          createTabFixture("done", "Done card", { tabColor: "teal" }),
        ],
        { dashboardVisibility: { icebox: true, done: true } },
      ),
    ],
  });
  await openPanel(page, "dashboard-panel");
  await expect(
    page.locator(".dashboard-statuses .dashboard-status-label"),
  ).toHaveText(["Note", "To Do", "Ready", "Doing", "Done"]);
  for (const viewport of [...BOTH_VIEWPORTS, BOTH_VIEWPORTS[0]]) {
    await page.setViewportSize(viewport);
    const mobile = viewport.width <= 512;
    await expect(
      page.locator(".dashboard-column-status .dashboard-status-label"),
    ).toHaveText(
      mobile
        ? ["Doing", "Ready", "To Do", "Done", "Note"]
        : ["Note", "To Do", "Ready", "Doing", "Done"],
    );
    const positions = await page
      .locator(".dashboard-board > .dashboard-column")
      .evaluateAll((elements) =>
        elements.map((element) => {
          const rect = element.getBoundingClientRect();
          return { x: rect.x, y: rect.y };
        }),
      );
    for (let index = 1; index < positions.length; index++)
      expect(mobile ? positions[index].y : positions[index].x).toBeGreaterThan(
        mobile ? positions[index - 1].y : positions[index - 1].x,
      );
  }
  for (const [status, color] of [
    ["icebox", "yellow"],
    ["todo", "gray"],
    ["ready", "orange"],
    ["in-progress", "indigo"],
    ["done", "teal"],
  ] as const)
    await expect(dashboardColumn(page, status)).toHaveAttribute(
      "data-tab-color",
      color,
    );
  for (const [status, title] of [
    ["icebox", "Note card"],
    ["todo", "Todo card"],
    ["ready", "Ready card"],
    ["in-progress", "Doing card"],
    ["done", "Done card"],
  ] as const)
    await expect(
      dashboardColumn(page, status).locator(".dashboard-card", {
        hasText: title,
      }),
    ).toBeVisible();
});
