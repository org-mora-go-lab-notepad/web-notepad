import type { Locator, Page } from "@playwright/test";

import { MOBILE_VIEWPORT, type Viewport } from "../../__constant__";

export const activeTabItem = (page: Page) =>
  page.locator(".tab-item.is-active");
export const activeTab = (page: Page) =>
  (page.viewportSize()?.width ?? 1280) <= 512
    ? page.locator(".dashboard-card.is-active .dashboard-card-open")
    : page.locator('.tab-item.is-active [role="tab"]');
export const addTabButton = (page: Page) =>
  page.getByRole("button", { name: "New tab", exact: true });

// Opens the PC tab context menu and chooses an item such as "Bookmark".
export async function chooseTabMenuItem(
  page: Page,
  itemName: string,
  tab = activeTab(page),
) {
  await tab.click({ button: "right" });
  await page.getByRole("menuitem", { name: itemName, exact: true }).click();
}

// Opens the tab menu with double-tap on the mobile viewport and right-click otherwise.
export async function openTabMenu(tab: Locator, viewport?: Viewport) {
  if (viewport === MOBILE_VIEWPORT) await tab.dblclick();
  else await tab.click({ button: "right" });
}

// Clicks the active tab colour icon `times` times (gray -> orange -> indigo -> gray by default).
export async function cycleActiveTabColor(page: Page, times = 1) {
  for (let count = 0; count < times; count += 1) {
    await page.locator(".tab-item.is-active .dirty-dot").click();
  }
}

export async function expectTabSavingLine(tab: Locator, saving: boolean) {
  const { expect } = await import("@playwright/test");
  await expect
    .poll(() =>
      tab.evaluate(
        (element) => getComputedStyle(element, "::after").animationName,
      ),
    )
    .toBe(saving ? "cloud-line-shimmer" : "none");
}
