import { type BrowserContext, expect, type Page } from "@playwright/test";

import { DEFAULT_SETTINGS } from "@/src/4-entity/notepad";

import { createGroupFixture, createTabFixture } from "../../../__fixture__";
import {
  authenticateBrowser,
  dashboardColumn,
  openPanel,
  toggleDashboardStatus,
  writeStoredState,
} from "../../../__util__";

export const defaultLabels = [
  "To Do",
  "Waiting",
  "In Progress",
  "Done",
  "Closed",
];
export const customLabels = ["Ideas", "Next", "Queued", "Working", "Shipped"];

export async function seedDefaults(
  page: Page,
  context: BrowserContext,
  override = false,
) {
  await authenticateBrowser(context);
  await writeStoredState(page, {
    settings: DEFAULT_SETTINGS,
    activeGroupId: "ungrouped",
    groups: [
      createGroupFixture("ungrouped", "Ungrouped", [
        createTabFixture("home", "Home note"),
      ]),
      createGroupFixture(
        "work",
        "Work",
        [createTabFixture("work-note", "Work note")],
        { dashboardStatusNames: override ? { ready: "Work queue" } : {} },
      ),
    ],
  });
}

export async function defaultForm(page: Page) {
  if (
    (await page.locator("#settings-panel").getAttribute("aria-hidden")) !==
    "false"
  )
    await openPanel(page, "settings-panel");
  return page.getByRole("form", { name: "Default status names", exact: true });
}

export async function saveDefaults(page: Page, labels = customLabels) {
  const form = await defaultForm(page);
  for (let index = 0; index < defaultLabels.length; index++)
    await form
      .getByRole("textbox", { name: defaultLabels[index], exact: true })
      .fill(labels[index]);
  await form.getByRole("button", { name: "Save", exact: true }).click();
  await page.locator("#settings-panel .side-panel-close").click();
}

export async function dashboardLabels(page: Page) {
  if (
    (await page.locator("#dashboard-panel").getAttribute("aria-hidden")) !==
    "false"
  )
    await openPanel(page, "dashboard-panel");
  const icebox = dashboardColumn(page, "icebox");
  for (let attempt = 0; attempt < 2 && !(await icebox.count()); attempt += 1) {
    await toggleDashboardStatus(page, "icebox");
    try {
      await expect(icebox).toHaveCount(1, { timeout: 1_500 });
    } catch {
      // A late cloud visibility restore can race the first toggle. Re-read the
      // rendered state and retry once rather than toggling a stale value.
    }
  }
  const labels = page.locator(".dashboard-statuses .dashboard-status-label");
  await expect(labels).toHaveCount(5);
  return labels;
}
