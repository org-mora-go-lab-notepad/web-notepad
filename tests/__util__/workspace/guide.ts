import { expect, type Page } from "@playwright/test";

import { openMoreMenu } from "./panel";

export async function openGuide(page: Page) {
  const menu = await openMoreMenu(page);
  await menu.getByRole("button", { name: /Guide|사용 가이드/i }).click();
  await expect(page.locator("dialog.user-guide")).toBeVisible();
  return page.locator("dialog.user-guide");
}
