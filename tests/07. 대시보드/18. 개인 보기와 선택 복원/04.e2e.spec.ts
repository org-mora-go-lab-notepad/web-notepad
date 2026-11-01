import { expect } from "@playwright/test";

import { sharingTest as test } from "../../__fixture__";
import { dashboardColumn, openPanel, readStoredState } from "../../__util__";
import { postApi } from "../../__util__/request";
import { getApi } from "../../__util__/request";

test("4. 동기화 기준이 없는 개인 보기 설정도 초기 서버 이력에 덮이지 않는다", async ({
  sharing: { owner, id },
}) => {
  test.setTimeout(60000);
  const { user } = await (
    await getApi(owner.request, "/api/auth/session")
  ).json();
  await expect
    .poll(() =>
      owner.evaluate(
        (userId) =>
          localStorage.getItem(`web-notepad-cloud-base:${userId}`) !== null,
        user.id,
      ),
    )
    .toBe(true);
  const history = await (
    await getApi(owner.request, "/api/notepad/history")
  ).json();
  const state = await readStoredState(owner);
  const response = await postApi(owner.request, "/api/notepad/history", {
    data: {
      eventId: crypto.randomUUID(),
      baseEventId: history.latest?.eventId ?? null,
      userId: user.id,
      snapshot: JSON.stringify({
        ...state,
        groups: state.groups.filter((group) => group.id === "ungrouped"),
        activeGroupId: "ungrouped",
        closedTabs: [],
        sharedDashboardVisibility: {},
        allGroupDashboardStatusNames: {},
      }),
    },
  });
  expect(response.ok()).toBe(true);
  await owner.evaluate(
    ({ userId, groupId }) => {
      const key = "web-notepad-storage";
      const stored = JSON.parse(localStorage.getItem(key)!);
      stored.state.sharedDashboardVisibility = {
        [groupId]: { icebox: true, done: false },
      };
      stored.state.allGroupDashboardStatusNames = { todo: "Next" };
      localStorage.setItem(key, JSON.stringify(stored));
      for (const kind of ["base", "pending", "local"])
        localStorage.removeItem(`web-notepad-cloud-${kind}:${userId}`);
    },
    { userId: user.id, groupId: id },
  );
  await owner.reload();
  await expect(
    owner.locator('.group-item[data-group-id="' + id + '"]'),
  ).toBeVisible();
  await expect(owner.locator(".home")).toHaveAttribute(
    "data-cloud-save",
    "saved",
    {
      timeout: 15000,
    },
  );
  await openPanel(owner, "dashboard-panel");
  await expect(dashboardColumn(owner, "icebox")).toBeVisible();
  await expect(dashboardColumn(owner, "done")).toHaveCount(0);
  await expect
    .poll(async () => {
      const latest = await (
        await getApi(owner.request, "/api/notepad/history")
      ).json();
      const snapshot = JSON.parse(latest.latest.snapshot);
      return {
        visibility: snapshot.sharedDashboardVisibility[id],
        names: snapshot.allGroupDashboardStatusNames,
      };
    })
    .toEqual({
      visibility: { icebox: true, done: false },
      names: { todo: "Next" },
    });
});
