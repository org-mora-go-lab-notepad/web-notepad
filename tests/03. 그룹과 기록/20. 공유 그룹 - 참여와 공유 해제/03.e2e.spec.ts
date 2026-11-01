import { expect } from "@playwright/test";

import { postApi } from "../../__util__/request";
import { getApi } from "../../__util__/request";
import { sharingTest as test } from "./__fixture__";
import { openSharingMenu } from "./__util__";

test("3. 그룹 나가기는 자신의 참여만 해제하고 주최자의 노트를 보존한다", async ({
  sharing: { guest, owner, id },
}) => {
  const menu = await openSharingMenu(guest, id);
  await menu.getByRole("button", { name: "Leave group", exact: true }).click();
  await guest
    .getByRole("alertdialog", { name: "Leave group", exact: true })
    .getByRole("button", { name: "Leave group", exact: true })
    .click();
  await expect(guest.locator('[data-group-id="' + id + '"]')).toHaveCount(0);
  const guestGroups = await (await getApi(guest.request, "/api/groups")).json();
  expect(guestGroups.groups).toHaveLength(0);
  const ownerGroups = await (await getApi(owner.request, "/api/groups")).json();
  expect(ownerGroups.groups[0].data.tabs[0].content).toBe("Keep this note");
  expect(
    (
      await postApi(guest.request, "/api/groups/leave", { data: { id } })
    ).status(),
  ).toBe(403);
});
