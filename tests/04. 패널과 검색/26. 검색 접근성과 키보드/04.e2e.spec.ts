import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import { openGlobalSearchPanel } from "../../__util__";

test("4. 검색 팝업을 열어도 입력창에 자동 포커스하지 않는다", async ({
  page,
}) => {
  await page.goto("/");
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await openGlobalSearchPanel(page);
    const search = page.getByRole("searchbox", { name: "Search tabs" });
    const popup = page.locator("#global-search-popup");
    await expect(search).toBeVisible();
    await expect(search).not.toBeFocused();
    const beforeFocus = (await popup.boundingBox())!;
    await search.click();
    await expect(search).toBeFocused();
    if (viewport.width <= 512) {
      await expect(popup).toHaveClass(/is-position-locked/);
      await page.setViewportSize({
        ...viewport,
        height: viewport.height - 300,
      });
      const afterKeyboardResize = (await popup.boundingBox())!;
      expect(afterKeyboardResize.x).toBeCloseTo(beforeFocus.x, 1);
      expect(afterKeyboardResize.y).toBeCloseTo(beforeFocus.y, 1);
      expect(afterKeyboardResize.width).toBeCloseTo(beforeFocus.width, 1);
      expect(afterKeyboardResize.height).toBeCloseTo(beforeFocus.height, 1);
    }
    await page.keyboard.press("Escape");
    await expect(popup).not.toHaveClass(/is-position-locked/);
  }
});
