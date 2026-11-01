import { expect } from "@playwright/test";

import { boardTest as test } from "../../__fixture__";
import {
  authenticateBrowser,
  groupsCommand,
  openBoard,
  selectBoardPost,
} from "../../__util__";
import { getApi } from "../../__util__/request";

test("4. 내 공유 그룹은 참여 대신 공유 취소를 제공하고 노트를 보존한다", async ({
  page,
  context,
  boardPost,
  boardOwnerToken,
}) => {
  await authenticateBrowser(context, boardOwnerToken);
  await page.goto("/");
  await openBoard(page);
  await selectBoardPost(page, boardPost.title);
  await expect(page.getByRole("link", { name: "Join this group" })).toHaveCount(
    0,
  );
  await page
    .locator(".board-detail")
    .getByRole("button", { name: "Cancel Sharing", exact: true })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Cancel Sharing", exact: true })
    .click();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect(
    page.locator(".board-entry", { hasText: boardPost.title }),
  ).toHaveCount(0);
  const records = (await (await getApi(page.request, "/api/groups")).json())
    .groups;
  expect(
    records.find((item: { id: string }) => item.id === boardPost.id)
      .sharingActive,
  ).toBe(false);
  await page.getByRole("link", { name: "Back", exact: true }).click();
  if ((await groupsCommand(page).getAttribute("aria-expanded")) !== "true")
    await groupsCommand(page).click();
  await expect(
    page.locator('#group-my-list [data-group-id="' + boardPost.id + '"]'),
  ).toBeVisible();
});
