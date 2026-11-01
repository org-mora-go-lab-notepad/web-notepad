import { expect, test } from "@playwright/test";

import { openMoreMenu } from "../../__util__";

test.use({ hasTouch: true });

test("5. 더보기의 테마 토글은 즉시 적용되고 페이지 이동과 새로고침에도 유지된다", async ({
  page,
}) => {
  await page.goto("/");
  const menu = await openMoreMenu(page);
  const toggle = menu.getByRole("switch", { name: "Theme" });
  await toggle.check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(menu).toBeVisible();
  await expect(page.locator("#settings-panel")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await page.reload();
  await openMoreMenu(page);
  await expect(toggle).toBeChecked();
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/board", "/my-page"]) {
    await page.goto(route);
    await openMoreMenu(page);
    const before = await toggle.isChecked();
    await toggle.tap();
    await expect(toggle).toBeChecked({ checked: !before });
    await expect(menu).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      before ? "dark" : "light",
    );
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      before ? "dark" : "light",
    );
  }
});
