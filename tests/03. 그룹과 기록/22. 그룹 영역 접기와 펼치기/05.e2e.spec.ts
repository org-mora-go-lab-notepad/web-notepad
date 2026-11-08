import { expect } from "@playwright/test";

import { sharingTest as test } from "../../__fixture__";
import { groupsCommand } from "../../__util__";

test("5. 공유 그룹 권한 조회 실패 시 숨기고 재시도로 권한을 확인한다", async ({
  sharing: { owner, id },
}) => {
  await owner.route("**/api/groups", (route) =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } }),
  );
  await owner.reload();
  if ((await groupsCommand(owner).getAttribute("aria-expanded")) !== "true")
    await groupsCommand(owner).click();
  const list = owner.locator("#group-shared-list");
  const row = list.locator('[data-group-id="' + id + '"]');
  const retry = list.getByRole("button", { name: "Try again", exact: true });
  await expect(retry).toBeVisible();
  await expect(row).toHaveCount(0);
  await owner.unroute("**/api/groups");
  await retry.click();
  await expect(row).toBeVisible();
  await expect(retry).toHaveCount(0);
});
