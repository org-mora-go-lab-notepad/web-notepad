import { expect } from "@playwright/test";

import { sharingTest as test } from "../../__fixture__";
import { createGroups, getApi, openTabMenu, switchGroup } from "../../__util__";

test("3. 공유 이동 중 대상 저장이 실패해도 재시도 후 탭을 안전하게 이동한다", async ({
  sharing: { owner, id },
}) => {
  const readSource = async () =>
    (await (await getApi(owner.request, "/api/groups")).json()).groups.find(
      (group: { id: string }) => group.id === id,
    );
  const original = (await readSource()).data.tabs[0];
  await createGroups(owner, "Target");
  await expect(owner.locator(".home")).toHaveAttribute(
    "data-cloud-save",
    "saved",
  );
  await switchGroup(owner, "Shared team");
  await owner.route("**/api/notepad/history", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 503,
          json: { error: "Simulated offline save" },
        })
      : route.continue(),
  );
  const blocked = owner.waitForResponse(
    (response) =>
      response.url().endsWith("/api/groups/update") &&
      response.status() === 503,
  );
  await owner.locator("textarea").first().fill("이동 직전 수정한 최신 본문");
  await openTabMenu(
    owner.getByRole("tab", { name: "이동 직전 수정한 최신 본문", exact: true }),
  );
  await owner
    .getByRole("menuitem", { name: "Move Group", exact: true })
    .click();
  await owner.getByRole("menuitem", { name: "Target", exact: true }).click();
  await blocked;
  expect((await readSource()).data.tabs).toContainEqual(original);
  await owner.unroute("**/api/notepad/history");
  await expect
    .poll(
      async () => {
        const history = await (
          await getApi(owner.request, "/api/notepad/history")
        ).json();
        return history.latest
          ? JSON.parse(history.latest.snapshot)
              .groups.flatMap((group: { tabs: { id: string }[] }) => group.tabs)
              .find((tab: { id: string }) => tab.id === original.id)
          : null;
      },
      { timeout: 20_000 },
    )
    .toMatchObject({ id: original.id, content: "이동 직전 수정한 최신 본문" });
  await expect
    .poll(
      async () =>
        (await readSource()).data.tabs.map((tab: { id: string }) => tab.id),
      { timeout: 20_000 },
    )
    .not.toContain(original.id);
});
