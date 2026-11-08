import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";

test("1. 하단 계정은 로그인, 더보기는 가이드·검색·북마크를 제공한다", async ({
  page,
}) => {
  await page.goto("/");
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await page.locator(".group-select-command").click();
    const trigger = page.locator(".footer .more-command");
    const login = page
      .locator(".footer")
      .getByRole("link", { name: "Continue with Kakao" });
    await expect(login).toBeVisible();
    await expect(login).toContainText("Login");
    const bounds = (await login.boundingBox())!;
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
    const icon = (await login.locator("svg").boundingBox())!;
    const label = (await login.locator("span").boundingBox())!;
    if (viewport.width > 512) {
      expect((icon.x + label.x + label.width) / 2).toBeCloseTo(
        bounds.x + bounds.width / 2,
        1,
      );
      for (const item of [icon, label]) {
        expect(item.y + item.height / 2).toBeCloseTo(
          bounds.y + bounds.height / 2,
          1,
        );
      }
    } else {
      expect(icon.x + icon.width / 2).toBeCloseTo(label.x + label.width / 2, 1);
      expect(label.y).toBeGreaterThanOrEqual(icon.y + icon.height);
    }
    await expect(page.locator(".header .auth-command")).toHaveCount(0);
    await trigger.click();
    const menu = page.locator("#group-more-menu");
    await expect(menu.getByRole("button")).toHaveText([
      "Guide",
      "Search",
      "Bookmark",
      "Settings",
    ]);
    await expect(
      menu.getByRole("link", { name: "Continue with Kakao" }),
    ).toHaveCount(0);
    await expect(menu.getByRole("switch", { name: "Theme" })).toBeVisible();
    await expect(menu.getByRole("button", { name: "Shortcut" })).toHaveCount(0);
    const menuBounds = (await menu.boundingBox())!;
    const footerBounds = (await page.locator(".footer").boundingBox())!;
    const triggerBounds = (await trigger.boundingBox())!;
    expect(menuBounds.x + menuBounds.width).toBeCloseTo(
      triggerBounds.x + triggerBounds.width,
      1,
    );
    expect(menuBounds.y + menuBounds.height).toBeLessThanOrEqual(
      footerBounds.y,
    );
    expect(menuBounds.x).toBeGreaterThanOrEqual(0);
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
  }
});
