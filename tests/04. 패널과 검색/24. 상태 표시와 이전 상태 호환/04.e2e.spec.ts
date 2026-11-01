import { expect } from "@playwright/test";

import { sharingTest as test } from "../../__fixture__";
import { dashboardColumn, openPanel } from "../../__util__";
import { postApi } from "../../__util__/request";
import { getApi } from "../../__util__/request";

test("4. 이전 표시 설정을 가진 공유 그룹도 Done을 기본 표시한다", async ({
  sharing: { owner, guest, id },
}) => {
  const record = (
    await (await getApi(guest.request, "/api/groups")).json()
  ).groups.find((group: { id: string }) => group.id === id);
  const response = await postApi(guest.request, "/api/groups/update", {
    data: {
      id,
      baseRevision: record.revision,
      data: {
        ...record.data,
        dashboardVisibility: { icebox: false, closed: false },
        tabs: record.data.tabs.map((tab: object) => ({
          ...tab,
          dashboardStatus: "closed",
        })),
      },
    },
  });
  expect(response.ok()).toBe(true);
  await owner.reload();
  await expect(owner.locator("button.auth-command")).toBeVisible();
  await owner.keyboard.press("Escape");
  await openPanel(owner, "dashboard-panel");
  await expect(
    dashboardColumn(owner, "done").locator(".dashboard-card"),
  ).toContainText("Keep this note");
  await expect(dashboardColumn(owner, "closed")).toHaveCount(0);
});
