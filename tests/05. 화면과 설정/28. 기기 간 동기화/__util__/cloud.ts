import { expect, type Page } from "@playwright/test";

import { getApi } from "../../../__util__/request";
import { ensureEditorTab } from "../../../__util__/workspace";

export async function openDevice(page: Page) {
  const loaded = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/notepad/history") &&
      response.request().method() === "GET",
  );
  await page.goto("/");
  expect((await loaded).ok()).toBe(true);
  await expect(page.locator("button.auth-command")).toContainText("Sync User");
  await ensureEditorTab(page);
}
export async function waitForSaved(page: Page) {
  await expect(page.locator(".home")).toHaveAttribute(
    "data-cloud-save",
    "saved",
    { timeout: 20_000 },
  );
}
export async function readHistory(page: Page): Promise<{
  count: number;
  latest: { eventId: string; snapshot: string } | null;
}> {
  const response = await getApi(page.request, "/api/notepad/history");
  expect(response.ok()).toBe(true);
  return response.json();
}
