import type { Page } from "@playwright/test";

import {
  bookmarkActiveTab,
  chooseGroupAction,
  createGroupsWithTabs,
  groupsCommand,
  readStoredState,
} from "../../../__util__";

export async function renameWorkGroup(page: Page) {
  await page.goto("/");
  await createGroupsWithTabs(page, "Work");
  await bookmarkActiveTab(page, "private note");
  const originalId = (await readStoredState(page)).activeGroupId;
  await groupsCommand(page).click();
  await chooseGroupAction(page, "Work", "수정");
  await page
    .getByRole("textbox", { name: "Edit Work group name" })
    .fill("Focus");
  await page.getByRole("button", { name: "Save group changes" }).click();
  return originalId;
}
