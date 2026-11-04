import { expect, test } from "@playwright/test";

import { MOBILE_VIEWPORT } from "../../__constant__";
import { closeMobileEditor, openEditor } from "../../__util__";
import { groupsCommand } from "../../__util__";

test.use({ viewport: MOBILE_VIEWPORT });

test("6. 모바일 뒤로가기는 그룹 사이드바를 먼저 닫고 이후 기존 탭 이력을 탐색한다", async ({
  page,
}) => {
  await openEditor(page);
  const editor = page.locator("textarea:visible");
  await editor.fill("First note");
  await closeMobileEditor(page);
  await page.getByRole("button", { name: "New tab", exact: true }).click();
  await editor.fill("Second note");
  await closeMobileEditor(page);
  const noteUrl = page.url();

  await groupsCommand(page).click();
  await expect(page.locator("#groups-menu")).toBeVisible();
  await page.goBack();
  await expect(page.locator("#groups-menu")).toHaveCount(0);
  await expect(groupsCommand(page)).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(".dashboard-card.is-active")).toContainText(
    "Second note",
  );
  await expect(page).toHaveURL(noteUrl);

  await page.goBack();
  await expect(page.locator(".dashboard-card.is-active")).toContainText(
    "First note",
  );
  await page.goForward();
  await expect(page.locator(".dashboard-card.is-active")).toContainText(
    "Second note",
  );
  await page.goForward();
  await expect(page.locator("#groups-menu")).toBeVisible();
});
