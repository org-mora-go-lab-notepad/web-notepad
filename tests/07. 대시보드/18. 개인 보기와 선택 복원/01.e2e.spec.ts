import { expect } from "@playwright/test";

import { sharingTest as test } from "../../__fixture__";
import {
  dashboardColumn,
  openPanel,
  toggleDashboardStatus,
} from "../../__util__";
import { getApi } from "../../__util__/request";

test("1. 공유 그룹의 To Do Closed 표시는 다른 사용자와 분리해 저장한다", async ({
  sharing: { owner, guest, id },
}) => {
  test.setTimeout(60000);
  let sharedPosts = 0;
  owner.on("request", (request) => {
    if (
      request.url().endsWith("/api/groups/update") &&
      request.method() === "POST"
    )
      sharedPosts++;
  });
  await openPanel(owner, "dashboard-panel");
  await toggleDashboardStatus(owner, "icebox");
  await toggleDashboardStatus(owner, "done");
  await expect(dashboardColumn(owner, "icebox")).toBeVisible();
  await expect(dashboardColumn(owner, "done")).toHaveCount(0);
  await expect(owner.locator(".home")).toHaveAttribute(
    "data-cloud-save",
    "saved",
    { timeout: 15000 },
  );
  expect(sharedPosts).toBe(0);
  const history = await (
    await getApi(owner.request, "/api/notepad/history")
  ).json();
  expect(
    JSON.parse(history.latest.snapshot).sharedDashboardVisibility[id],
  ).toEqual({ icebox: true, done: false });
  await guest.reload();
  await expect(
    guest.locator('.group-item[data-group-id="' + id + '"]'),
  ).toBeVisible();
  await expect(guest.locator(".group-current-value")).toHaveText("Shared team");
  await openPanel(guest, "dashboard-panel");
  await expect(dashboardColumn(guest, "icebox")).toHaveCount(0);
  await expect(dashboardColumn(guest, "done")).toBeVisible();
  const saved = guest.waitForResponse(
    (r) => r.url().endsWith("/api/groups/update") && r.ok(),
  );
  await guest
    .locator("textarea")
    .first()
    .fill("Other user changed shared content");
  await saved;
  await owner.goto("/");
  await expect(owner.locator(".group-current-value")).toHaveText("Shared team");
  await openPanel(owner, "dashboard-panel");
  await expect(dashboardColumn(owner, "icebox")).toBeVisible();
  await expect(dashboardColumn(owner, "done")).toHaveCount(0);
});
