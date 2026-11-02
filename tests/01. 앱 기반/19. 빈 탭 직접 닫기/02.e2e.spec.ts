import { expect } from "@playwright/test";

import { sharingTest as test } from "../../__fixture__";
import { getApi } from "../../__util__";

test("2. 공유 탭을 비운 직후 직접 닫으면 서버에서 해당 탭만 제거한다", async ({
  sharing: { owner, id, group },
}) => {
  const originalId = group.tabs[0].id;
  await expect(owner.locator("textarea").first()).toHaveValue("Keep this note");
  await owner.locator("textarea").first().fill("");
  await owner.locator(".tab-item").first().locator(".tab-close").click();
  await expect
    .poll(async () => {
      const { groups } = await (
        await getApi(owner.request, "/api/groups")
      ).json();
      const shared = groups.find((record: { id: string }) => record.id === id);
      return shared.data.tabs.some(
        (tab: { id: string }) => tab.id === originalId,
      );
    })
    .toBe(false);
  await owner.reload();
  await expect(owner.locator("textarea")).toHaveCount(0);
  await expect(
    owner.getByRole("button", { name: "New tab", exact: true }).first(),
  ).toBeVisible();
  const { groups } = await (await getApi(owner.request, "/api/groups")).json();
  const saved = groups.find((record: { id: string }) => record.id === id);
  expect(saved.data.tabs.map((tab: { id: string }) => tab.id)).not.toContain(
    originalId,
  );
  expect(saved.data.name).toBe(group.name);
});
