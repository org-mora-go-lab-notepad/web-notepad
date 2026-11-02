import type { Page } from "@playwright/test";

import {
  bookmarkActiveTab,
  chooseGroupAction,
  createGroupsWithTabs,
  groupActionsButton,
  groupsCommand,
} from "../../../__util__";

// Creates an "Archive" group with a bookmarked note and returns the delete-flow locators;
// `openDelete` chooses Delete from the group's action dropdown; focus returns to its trigger.
export async function seedDeletableGroup(page: Page) {
  await page.goto("/");
  await createGroupsWithTabs(page, "Archive");
  await bookmarkActiveTab(page, "archived note");
  return {
    toggle: groupsCommand(page),
    menuButton: groupActionsButton(page, "Archive"),
    openDelete: () => chooseGroupAction(page, "Archive", "삭제"),
    popup: page.getByRole("alertdialog", { name: "Delete group" }),
  };
}
