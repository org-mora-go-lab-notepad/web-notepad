import type { Page } from "@playwright/test";

import { ensureEditorTab } from "../workspace";
import { chooseTabMenuItem } from "./tab";

export async function bookmarkActiveTab(page: Page, content: string) {
  await ensureEditorTab(page);
  await page.locator("textarea").fill(content);
  await chooseTabMenuItem(page, "Bookmark");
}
