import { expect } from "@playwright/test";

import { DEFAULT_SETTINGS } from "@/src/4-entity/notepad";

import { createTabFixture, sharingTest as test } from "../../__fixture__";
import {
  dashboardColumn,
  openPanel,
  readStoredState,
  writeStoredState,
} from "../../__util__";
import { postApi } from "../../__util__/request";
import { getApi } from "../../__util__/request";

test("4. 공유 그룹은 개인 색상 설정이 달라도 같은 상태와 컬럼 순서를 복원한다", async ({
  sharing: { owner, guest, id },
}) => {
  test.setTimeout(60000);
  const record = (
    await (await getApi(owner.request, "/api/groups")).json()
  ).groups.find((group: { id: string }) => group.id === id);
  const cards = [
    createTabFixture(id + "-note", "Note card", {
      tabColor: "yellow",
      dashboardStatus: "icebox",
    }),
    createTabFixture(id + "-todo", "Todo card", { tabColor: "gray" }),
    createTabFixture(id + "-ready", "Ready card", {
      tabColor: "orange",
      dashboardStatus: "ready",
    }),
    createTabFixture(id + "-doing", "Doing card", { tabColor: "indigo" }),
    createTabFixture(id + "-done", "Done card", { tabColor: "teal" }),
  ];
  const saved = await postApi(owner.request, "/api/groups/update", {
    data: {
      id,
      baseRevision: record.revision,
      data: { ...record.data, tabs: cards },
      deletedTabIds: record.data.tabs.map((tab: { id: string }) => tab.id),
      confirmedDeletion: true,
    },
  });
  expect(saved.ok()).toBe(true);
  await guest.setViewportSize({ width: 390, height: 800 });
  for (const page of [owner, guest]) {
    const state = await readStoredState(page);
    await writeStoredState(page, {
      ...state,
      settings: {
        ...DEFAULT_SETTINGS,
        tabColorCycle:
          page === owner
            ? ["gray", "orange", "indigo"]
            : ["indigo", "teal", "gray"],
      },
      sharedDashboardVisibility: { [id]: { icebox: true, done: true } },
    });
    await expect(
      page.locator('.group-item[data-group-id="' + id + '"]'),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await openPanel(page, "dashboard-panel");
    await expect(
      page.locator(".dashboard-statuses .dashboard-status-label"),
    ).toHaveText(["Note", "To Do", "Ready", "Doing", "Done"]);
    await expect
      .poll(() =>
        page
          .locator(".dashboard-column")
          .evaluateAll((columns) =>
            columns.map((column) => column.getAttribute("data-status")),
          ),
      )
      .toEqual(
        (page.viewportSize()?.width ?? 1280) <= 512
          ? ["in-progress", "ready", "todo", "done", "icebox"]
          : ["icebox", "todo", "ready", "in-progress", "done"],
      );
    for (const [status, title] of [
      ["icebox", "Note card"],
      ["todo", "Todo card"],
      ["ready", "Ready card"],
      ["in-progress", "Doing card"],
      ["done", "Done card"],
    ] as const) {
      await expect(
        dashboardColumn(page, status).locator(".dashboard-card strong"),
      ).toHaveText([title]);
    }
    await page.reload();
    for (const [status, title] of [
      ["todo", "Todo card"],
      ["in-progress", "Doing card"],
      ["done", "Done card"],
    ] as const)
      await expect(
        dashboardColumn(page, status).locator(".dashboard-card strong"),
      ).toHaveText([title]);
  }
});
