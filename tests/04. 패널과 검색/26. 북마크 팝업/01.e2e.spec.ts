import { expect, test } from "@playwright/test";

import { openBookmarksPanel, openGlobalSearchPanel } from "../../__util__";

test("1. 검색과 북마크는 20% 넓고 중앙보다 80px 위인 모달로 연다", async ({
  page,
}) => {
  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const workspace = page.locator(".workspace"),
      before = (await workspace.boundingBox())!.width;
    await openBookmarksPanel(page);
    const popup = page.locator("#bookmarks-panel"),
      box = (await popup.boundingBox())!;
    expect(box.width).toBeCloseTo(Math.min(655.2, width - 32), 0);
    expect(box.height).toBeCloseTo(540.8, 0);
    expect(box.x + box.width / 2).toBeCloseTo(width / 2, 0);
    expect(box.y + box.height / 2).toBeCloseTo(320, 0);
    expect(await popup.evaluate((element) => element.matches(":modal"))).toBe(
      true,
    );
    expect(
      await popup.evaluate(
        (element) => getComputedStyle(element, "::backdrop").backgroundColor,
      ),
    ).toBe("rgba(0, 0, 0, 0.65)");
    const widthWithMenu = (await workspace.boundingBox())!.width;
    expect(widthWithMenu).toBeLessThanOrEqual(before);
    if (width >= 768) expect(widthWithMenu).toBeLessThan(before);
    await expect(
      popup.locator(".side-panel-resizer, .side-panel-pin, .side-panel-drawer"),
    ).toHaveCount(0);
    await page.keyboard.press("Escape");
    await openGlobalSearchPanel(page);
    const search = (await page.locator("#global-search-popup").boundingBox())!;
    expect(search.width).toBeCloseTo(box.width, 0);
    expect(search.height).toBeCloseTo(box.height * (width <= 512 ? 1.2 : 1), 0);
    expect(search.y).toBeCloseTo(width <= 512 ? 36 : box.y, 0);
    expect(search.x).toBeCloseTo(box.x, 0);
    await page.keyboard.press("Escape");
  }
});
