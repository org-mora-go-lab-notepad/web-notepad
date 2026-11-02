import { expect } from "@playwright/test";

import { sharingTest as test } from "../../__fixture__";
import { createGroupWithTab, openSystemGroupMenu } from "../../__util__";
test("4. My Group을 접은 채 그룹을 생성하면 펼쳐서 새 그룹을 보여준다", async ({
  sharing: { owner },
}) => {
  await owner.getByRole("button", { name: "My Group", exact: true }).click();
  await createGroupWithTab(owner, "New personal group");
  await expect(
    owner.getByRole("button", { name: "My Group", exact: true }),
  ).toHaveAttribute("aria-expanded", "true");
  await expect(
    owner
      .locator("#group-my-list")
      .getByRole("button", { name: "New personal group", exact: true }),
  ).toBeVisible();
  const systemGroups = await openSystemGroupMenu(owner);
  await expect(
    systemGroups.getByRole("button", { name: "All Group" }),
  ).toBeVisible();
  await expect(
    systemGroups.getByRole("button", { name: "Ungrouped" }),
  ).toBeVisible();
});
