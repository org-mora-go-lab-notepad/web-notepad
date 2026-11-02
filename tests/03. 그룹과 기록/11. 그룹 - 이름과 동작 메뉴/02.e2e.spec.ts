import { expect, test } from "@playwright/test";

import {
  chooseGroupAction,
  createGroupsWithTabs,
  groupsCommand,
  groupStatusName,
} from "../../__util__";

test("2. 이름 수정의 취소 버튼은 입력한 이름을 버리고 기존 이름을 유지한다", async ({
  page,
}) => {
  await page.goto("/");
  await createGroupsWithTabs(page, "Work");
  await groupsCommand(page).click();
  await chooseGroupAction(page, "Work", "수정");
  await page
    .getByRole("textbox", { name: "Edit Work group name" })
    .fill("Cancelled");
  await page.getByRole("button", { name: "Cancel group changes" }).click();
  await expect(groupStatusName(page)).toHaveText("Work");
});
