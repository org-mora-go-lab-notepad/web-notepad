import { expect } from "@playwright/test";

import { createTabFixture, sharingTest as test } from "../../__fixture__";
import { getApi } from "../../__util__";

test("2. 공유 누락 거부 응답에도 현재 수정 본문을 잃지 않는다", async ({
  sharing: { owner, id },
}) => {
  const record = (
    await (await getApi(owner.request, "/api/groups")).json()
  ).groups.find((item: { id: string }) => item.id === id);
  const added = createTabFixture(`${id}-keep`, "서버에 남길 탭");
  expect(
    (
      await owner.request.post("/api/groups/update", {
        data: {
          id,
          baseRevision: record.revision,
          data: { ...record.data, tabs: [...record.data.tabs, added] },
        },
      })
    ).ok(),
  ).toBe(true);
  await owner.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    owner.locator(".tab-item").filter({ hasText: "서버에 남길 탭" }),
  ).toBeVisible();
  let corrupted = false;
  await owner.route("**/api/groups/update", async (route) => {
    const data = route.request().postDataJSON();
    if (corrupted) return route.continue();
    corrupted = true;
    data.data.tabs = data.data.tabs.filter(
      (tab: { id: string }) => tab.id !== added.id,
    );
    await route.continue({ postData: JSON.stringify(data) });
  });
  const rejected = owner.waitForResponse(
    (response) =>
      response.url().endsWith("/api/groups/update") &&
      response.status() === 409,
  );
  await owner.locator("textarea").first().fill("거부 응답 중에도 남길 수정");
  await rejected;
  await expect(owner.locator("textarea").first()).toHaveValue(
    "거부 응답 중에도 남길 수정",
  );
  await expect
    .poll(async () => {
      const records = (
        await (await getApi(owner.request, "/api/groups")).json()
      ).groups;
      return records
        .find((item: { id: string }) => item.id === id)
        .data.tabs.map((tab: { content: string }) => tab.content);
    })
    .toEqual(["거부 응답 중에도 남길 수정", "서버에 남길 탭"]);
});
