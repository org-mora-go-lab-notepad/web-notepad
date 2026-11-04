import { expect } from "@playwright/test";

import { previewTest as test } from "./__fixture__";
test("9. 시트 높이를 재접속 후 복원한다", async ({ page, previewData }) => {
  const card = page.locator(
    '.dashboard-card[data-tab-id="long-note"] .dashboard-card-open',
  );
  const sheet = page.locator(".dashboard-preview");
  await card.click();
  await expect(sheet.locator("h2")).toHaveText(previewData.long.title);
  const grip = sheet.getByRole("slider");
  for (const target of [25, 50, 75, 100, 50]) {
    const current = Number(await grip.getAttribute("aria-valuenow"));
    const box = (await grip.boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(
      x,
      Math.max(0, y + ((current - target) / 100) * page.viewportSize()!.height),
      { steps: 8 },
    );
    // A settled drag differs from the quick flick gesture.
    await page.waitForTimeout(160);
    await page.mouse.up();
    await expect(grip).toHaveAttribute("aria-valuenow", String(target));
    await expect
      .poll(async () => (await sheet.boundingBox())!.height)
      .toBeCloseTo((page.viewportSize()!.height * target) / 100, 0);
  }
  await sheet.locator(".bottom-sheet-header button").click();
  await page.reload();
  await card.click();
  await expect(sheet.getByRole("slider")).toHaveAttribute(
    "aria-valuenow",
    "50",
  );
});
