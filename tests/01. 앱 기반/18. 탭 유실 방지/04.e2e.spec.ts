import { expect, test } from "@playwright/test";

import {
  createClosedTabFixture,
  createGroupFixture,
  createTabFixture,
} from "../../__fixture__";
import {
  authenticate,
  getApi,
  groupsCommand,
  writeStoredState,
} from "../../__util__";

test("4. 공유 전환 시 개인 보관 기록을 원래 ID와 본문으로 유지한다", async ({
  page,
  context,
}) => {
  await authenticate(context);
  const archived = createClosedTabFixture(
    "archive-entry",
    "team",
    createTabFixture("old-note", "개인 보관 원문", { open: false }),
  );
  await writeStoredState(page, {
    groups: [
      createGroupFixture("ungrouped", "Ungrouped", [
        createTabFixture("blank", ""),
      ]),
      createGroupFixture("team", "Team", [
        createTabFixture("share-note", "공유할 본문"),
      ]),
    ],
    activeGroupId: "team",
    closedTabs: [archived],
  });
  await expect(page.locator(".home")).toHaveAttribute(
    "data-cloud-save",
    "saved",
  );
  await groupsCommand(page).click();
  const row = page.locator('[data-group-id="team"]');
  await row.getByRole("button", { name: "Team group actions" }).click();
  await row.getByRole("button", { name: "Share Team group" }).click();
  await expect(
    page
      .getByRole("dialog", { name: "Share Team" })
      .getByLabel("Group share link"),
  ).toBeVisible();
  await page
    .getByRole("dialog", { name: "Share Team" })
    .getByRole("button", { name: "Close", exact: true })
    .last()
    .click();
  await expect
    .poll(async () => {
      const latest = (
        await (await getApi(page.request, "/api/notepad/history")).json()
      ).latest;
      return latest ? JSON.parse(latest.snapshot).closedTabs : [];
    })
    .toMatchObject([{ ...archived, groupId: "ungrouped" }]);
  const latest = (
    await (await getApi(page.request, "/api/notepad/history")).json()
  ).latest;
  expect(
    JSON.parse(latest.snapshot).groups.map((group: { id: string }) => group.id),
  ).not.toContain("team");
});
