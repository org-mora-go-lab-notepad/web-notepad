import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import { authenticateBrowser } from "../../__util__";

test("8. Workspace sync 아래에 고정 푸터와 분리된 여백을 남긴다", async ({
  page,
  context,
}) => {
  await authenticateBrowser(context);
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize({ ...viewport, height: 568 });
    await page.goto("/my-page");
    const sync = page.locator(".my-page-sync");
    await expect(sync).toBeVisible();
    await page.locator(".my-page").evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    const syncBounds = (await sync.boundingBox())!;
    const footerBounds = (await page.locator(".footer").boundingBox())!;
    const gap = footerBounds.y - syncBounds.y - syncBounds.height;
    expect(gap, "Workspace sync와 고정 푸터 사이 여백").toBeGreaterThanOrEqual(
      31,
    );
    await expect(sync).toBeInViewport();
    const padding = await page
      .locator(".my-page")
      .evaluate((element) =>
        parseFloat(getComputedStyle(element).paddingBottom),
      );
    expect(padding).toBeGreaterThanOrEqual(footerBounds.height + 31);
  }
});
