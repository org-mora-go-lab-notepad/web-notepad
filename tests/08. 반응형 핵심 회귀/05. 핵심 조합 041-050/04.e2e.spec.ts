import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";

test("4. 412x915 system 0.9 핵심 반응형 계약을 유지한다", async ({ page }) => {
  const viewport = { width: 412, height: 915 };
  const theme = "system";
  const fontScale = 0.9;

  await page.setViewportSize(viewport);
  await page.addInitScript(
    ({ selectedTheme, selectedScale }) => {
      if (selectedTheme === "system")
        localStorage.removeItem("web-notepad-theme");
      else localStorage.setItem("web-notepad-theme", selectedTheme);
      localStorage.setItem(
        "web-notepad-storage",
        JSON.stringify({
          state: { settings: { fontScale: selectedScale } },
          version: 0,
        }),
      );
    },
    { selectedTheme: theme, selectedScale: fontScale },
  );
  await openEditor(page);

  const main = page.locator("main.home");
  const footer = page.locator(".footer");
  await expect(main).toBeVisible();
  await expect(page.locator("textarea").first()).toBeVisible();
  await expect(footer).toBeVisible();
  await expect(page.locator(".group-select-command")).toBeVisible();
  await expect(page.locator(".dashboard-command")).toBeVisible();
  await expect(footer.locator(".auth-command:not(.is-loading)")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect
    .poll(() =>
      page.evaluate(() =>
        Number.parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--font-scale",
          ),
        ),
      ),
    )
    .toBe(fontScale);

  const footerBox = await footer.boundingBox();
  expect(footerBox).not.toBeNull();
  expect(footerBox!.x + footerBox!.width).toBeLessThanOrEqual(
    viewport.width + 1,
  );
  expect(footerBox!.height).toBeCloseTo(81.8, 1);
  expect(footerBox!.y + footerBox!.height).toBeCloseTo(viewport.height, 1);
});
