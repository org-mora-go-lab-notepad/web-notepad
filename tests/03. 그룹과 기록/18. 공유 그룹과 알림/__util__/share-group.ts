import { expect, type Page } from "@playwright/test";

import {
  createGroupsWithTabs,
  ensureEditorTab,
  groupsCommand,
} from "../../../__util__";

export async function shareGroup(page: Page, name: string) {
  await createGroupsWithTabs(page, name);
  await ensureEditorTab(page);
  await page.locator("textarea").first().fill(`${name} shared note`);
  await groupsCommand(page).click();
  const row = page.locator(".group-item", { hasText: name });
  await row.getByRole("button", { name: `${name} group actions` }).click();
  await row.getByRole("button", { name: `Share ${name} group` }).click();
  const dialog = page.getByRole("dialog", { name: `Share ${name}` });
  await expect(dialog.getByLabel("Group share link")).toBeVisible();
  const url = await dialog.getByLabel("Group share link").inputValue();
  return { dialog, url };
}
