import type { Page } from "@playwright/test";

export const previewCard = (page: Page, id: string) =>
  page.locator(`.dashboard-card[data-tab-id="${id}"] .dashboard-card-open`);
export const previewSheet = (page: Page) => page.locator(".dashboard-preview");
