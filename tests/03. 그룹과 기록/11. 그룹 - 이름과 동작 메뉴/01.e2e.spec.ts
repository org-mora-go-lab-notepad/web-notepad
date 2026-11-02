import { expect, test } from "@playwright/test";

import {
  chooseGroupAction,
  createGroupsWithTabs,
  groupsCommand,
  groupStatusName,
} from "../../__util__";

test("1. 그룹 이름 수정 입력에서 Enter를 누르면 앞뒤 공백을 제거해 저장한다", async ({
  page,
}) => {
  await page.goto("/");
  await createGroupsWithTabs(page, "Work");
  await groupsCommand(page).click();
  await chooseGroupAction(page, "Work", "수정");
  const input = page.getByRole("textbox", { name: "Edit Work group name" });
  await input.fill(" Focus ");
  await input.press("Enter");
  await expect(groupStatusName(page)).toHaveText("Focus");
});
