import { expect } from "@playwright/test";

import { sharingTest as test } from "../../__fixture__";
import { getApi } from "../../__util__";

test("4. 공유 빈 탭 닫기 충돌 후 재시도도 다른 사용자의 본문을 보존한다", async ({
  sharing: { owner, id, group },
}) => {
  let intercepted = false;
  await owner.route("**/api/groups/update", async (route) => {
    if (intercepted) return route.continue();
    intercepted = true;
    const request = route.request().postDataJSON();
    const current = (
      await (await getApi(owner.request, "/api/groups")).json()
    ).groups.find((record: { id: string }) => record.id === id);
    const tabs = current.data.tabs.map(
      (tab: { id: string; content: string }) =>
        tab.id === group.tabs[0].id
          ? {
              ...tab,
              title: "다른 사용자 최신 원문",
              content: "다른 사용자 최신 원문",
            }
          : tab,
    );
    expect(
      (
        await owner.request.post("/api/groups/update", {
          data: {
            id,
            baseRevision: current.revision,
            data: { ...current.data, tabs },
          },
        })
      ).ok(),
    ).toBe(true);
    expect(request.emptyClosedTabIds).toContain(group.tabs[0].id);
    await route.continue();
  });
  const retried = owner.waitForResponse(
    (response) =>
      response.url().endsWith("/api/groups/update") &&
      response.status() === 200,
  );
  await owner.locator("textarea").first().fill("");
  await owner.locator(".tab-item").first().locator(".tab-close").click();
  await expect.poll(() => intercepted).toBe(true);
  await expect
    .poll(async () => {
      const { groups } = await (
        await getApi(owner.request, "/api/groups")
      ).json();
      return groups
        .find((record: { id: string }) => record.id === id)
        .data.tabs.find((tab: { id: string }) => tab.id === group.tabs[0].id)
        ?.content;
    })
    .toBe("다른 사용자 최신 원문");
  await retried;
  await owner.reload();
  await expect(
    owner.locator(".tab-item").filter({ hasText: "다른 사용자 최신 원문" }),
  ).toBeVisible();
});
