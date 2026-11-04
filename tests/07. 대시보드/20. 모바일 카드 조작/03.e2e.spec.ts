import { expect } from "@playwright/test";

import { previewTest as test } from "../19. 모바일 카드 미리보기/__fixture__";
import { flickSheet } from "./__util__";
test("3. 강한 아래 플릭은 내용을 보존하고 시트만 닫는다", async ({
  page,
  previewData,
}) => {
  const card = page.locator('.dashboard-card[data-tab-id="long-note"]');
  await card.locator(".dashboard-card-open").tap();
  const sheet = page.locator(".dashboard-preview");
  await expect(sheet.locator("h2")).toHaveText(previewData.long.title);
  await sheet.locator("textarea").fill("Flick keeps edits");
  await flickSheet(page, 100, 45);
  await expect(sheet).toBeHidden();
  await expect(card).toHaveClass(/is-active/);
  await expect(card).toContainText("Flick keeps edits");
  await expect(page.locator("#dashboard-panel")).toBeVisible();
  await expect(page.locator(".dashboard-command")).toHaveClass(/is-active/);
  await card.locator(".dashboard-card-open").click();
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("slider")).toHaveAttribute(
    "aria-valuenow",
    "75",
  );
  await expect(sheet.locator("textarea")).toHaveValue("Flick keeps edits");
  await expect(sheet.locator("textarea")).toBeEditable();
});
