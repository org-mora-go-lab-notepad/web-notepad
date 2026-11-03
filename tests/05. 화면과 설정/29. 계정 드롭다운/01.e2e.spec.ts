import { expect, test } from "@playwright/test";

import { authenticateBrowser, writeStoredState } from "../../__util__";

test("1. 하단 로그인 계정 위에 Logout·My Page를 순서대로 표시한다", async ({
  page,
  context,
}) => {
  await authenticateBrowser(context);
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await writeStoredState(page, { settings: { language: "ko" } });
    const trigger = page.locator("button.auth-command");
    await trigger.click();
    const menu = page.getByRole("menu", { name: "계정 메뉴", exact: true });
    await expect(menu.getByRole("menuitem")).toHaveText([
      "로그아웃",
      "내 페이지",
    ]);
    const anchor = (await trigger.boundingBox())!,
      bounds = (await menu.boundingBox())!;
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(anchor.y - 7);
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    await page.keyboard.press("Escape");
  }
});
