import { expect, type Page } from "@playwright/test";

import { closeMobileEditor } from "./editor";

// The group button on the left of the bottom bar (icon + current group name).
export const groupsCommand = (page: Page) =>
  page.locator(".group-select-command");
export const groupSelectCommand = (page: Page) =>
  page.locator(".group-select-command");
export const systemGroupCommand = (page: Page) =>
  page.locator(".group .system-group-command");
export const moreCommand = (page: Page) =>
  page.locator(".footer .more-command");
export async function openBookmarksPanel(page: Page) {
  const menu = await openMoreMenu(page);
  await menu.getByRole("button", { name: /Bookmark|북마크/i }).click();
  await expect(page.locator("#bookmarks-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
}
export const groupStatusName = (page: Page) =>
  page.locator(".group-current-value");
export const shortcutsCommand = (page: Page) =>
  page.locator('button[aria-controls="shortcuts-panel"]');

export async function openMoreMenu(page: Page) {
  await closeMobileEditor(page);
  const menu = page.locator("#group-more-menu");
  if (!(await menu.isVisible())) await moreCommand(page).click();
  await expect(menu).toBeVisible();
  return menu;
}

export async function openSystemGroupMenu(page: Page) {
  await closeMobileEditor(page);
  if ((await groupsCommand(page).getAttribute("aria-expanded")) !== "true")
    await groupsCommand(page).click();
  const menu = page.locator("#group-system-menu");
  if (!(await menu.isVisible())) await systemGroupCommand(page).click();
  return menu;
}

export const openHeaderMenu = openMoreMenu;

export async function openPanel(page: Page, panelId: string) {
  await closeMobileEditor(page);
  if (panelId === "bookmarks-panel") {
    await openBookmarksPanel(page);
    return;
  }
  const command = page
    .locator(`button[aria-controls="${panelId}"]:visible`)
    .first();
  if (panelId === "shortcuts-panel" || panelId === "settings-panel") {
    if (panelId === "shortcuts-panel") {
      const tools = await openMoreMenu(page);
      await tools.getByRole("button", { name: /Guide|사용 가이드/i }).click();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /Shortcut|단축키/i })
        .click();
    } else {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const more = await openMoreMenu(page);
          await more
            .getByRole("button", { name: /Settings|설정/i })
            .press("Enter", { timeout: 1500 });
          await expect(page.locator("#settings-panel")).toHaveAttribute(
            "aria-hidden",
            "false",
            { timeout: 1500 },
          );
          break;
        } catch (error) {
          if (attempt === 2) throw error;
        }
      }
    }
  } else if (
    await page.locator('.side-panel-drawer[aria-hidden="false"]').count()
  ) {
    // An overlay can cover the footer; keyboard activation remains available.
    await command.press("Enter");
  } else {
    await command.click();
  }
  await expect(page.locator(`#${panelId}`)).toHaveAttribute(
    "aria-hidden",
    "false",
  );
}

export async function toggleDashboardStatus(
  page: Page,
  status: "icebox" | "done",
) {
  const trigger = page.locator(".dashboard-options-trigger");
  if ((await trigger.getAttribute("aria-expanded")) !== "true")
    await trigger.click();
  const command = page.locator(`.dashboard-${status}-command`);
  const previous = await command.getAttribute("aria-pressed");
  await command.click();
  await expect(command).toHaveAttribute(
    "aria-pressed",
    previous === "true" ? "false" : "true",
  );
  if ((await trigger.getAttribute("aria-expanded")) === "true")
    await trigger.click();
}
export const openShortcutsPanel = (page: Page) =>
  openPanel(page, "shortcuts-panel");
export const openSettingsPanel = (page: Page) =>
  openPanel(page, "settings-panel");
export async function openGlobalSearchPanel(page: Page) {
  await openMoreMenu(page);
  await page.locator('button[aria-controls="global-search-popup"]').click();
  await expect(page.locator("#global-search-popup")).toBeVisible();
}

// Creates a group from the open group dropdown.
export async function createGroup(page: Page, name: string) {
  if (
    !(await page
      .getByRole("textbox", { name: "New group name" })
      .isVisible()
      .catch(() => false))
  )
    await openSystemGroupMenu(page);
  await page.getByRole("textbox", { name: "New group name" }).fill(name);
  await page.getByRole("button", { name: "Create group" }).click();
}

// Explicit user-driven note preparation for scenarios that edit newly created groups.
export async function createGroupWithTab(page: Page, name: string) {
  await createGroup(page, name);
  if (await page.locator("#group-system-menu").isVisible())
    await page.keyboard.press("Escape");
  if (
    (page.viewportSize()?.width ?? 1280) <= 512 &&
    (await groupsCommand(page).getAttribute("aria-expanded")) === "true"
  )
    await groupsCommand(page).click();
  await page
    .getByRole("button", { name: "New tab", exact: true })
    .first()
    .click();
}
export async function createGroupsWithTabs(page: Page, ...names: string[]) {
  for (const name of names) {
    await createGroupWithTab(page, name);
    await closeMobileEditor(page);
  }
  if (await page.locator("#group-system-menu").isVisible())
    await page.keyboard.press("Escape");
  if ((await groupsCommand(page).getAttribute("aria-expanded")) === "true")
    await page.keyboard.press("Escape");
}

// Opens the group dropdown, creates the groups, and closes it again.
export async function createGroups(page: Page, ...names: string[]) {
  await groupsCommand(page).click();
  for (const name of names) await createGroup(page, name);
  if (await page.locator("#group-system-menu").isVisible())
    await page.keyboard.press("Escape");
  if ((await groupsCommand(page).getAttribute("aria-expanded")) === "true")
    await page.keyboard.press("Escape");
}

// Opens the group sidebar, selects the group with the exact name and closes it when needed.
export async function switchGroup(page: Page, name: string) {
  await closeMobileEditor(page);
  if (
    name === "All Group" ||
    name === "All My Group" ||
    name === "All Shared Group" ||
    name === "Ungrouped"
  ) {
    const menu = await openSystemGroupMenu(page);
    await menu.getByRole("button", { name, exact: true }).click();
    if ((await groupsCommand(page).getAttribute("aria-expanded")) === "true")
      await page.keyboard.press("Escape");
    return;
  }
  await groupsCommand(page).click();
  await page
    .locator(".group-item")
    .getByRole("button", { name, exact: true })
    .click();
  // Selecting keeps the dropdown open, so close it for the caller.
  await page.keyboard.press("Escape");
}
