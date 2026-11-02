import type { Page } from "@playwright/test";

import { openEditor } from "../../../__util__";
import { chooseTabMenuItem, openSettingsPanel } from "../../../__util__";
import { languageRadio, settingsPanel } from "../settings";

type MarkedWorkspaceOptions = {
  bookmark?: boolean;
};

export async function prepareMarkedWorkspace(
  page: Page,
  { bookmark = false }: MarkedWorkspaceOptions = {},
) {
  await openEditor(page);
  await page.locator(".note-area").fill("Alpha task\nBody");
  const tab = page.getByRole("tab", { name: "Alpha task", exact: true });
  if (bookmark) await chooseTabMenuItem(page, "Bookmark", tab);
  return tab;
}

export async function switchWorkspaceToKorean(page: Page) {
  await openSettingsPanel(page);
  const panel = settingsPanel(page);
  await languageRadio(page, "한국어").check();
  return panel;
}
