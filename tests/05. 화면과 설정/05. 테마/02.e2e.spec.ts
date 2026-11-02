import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import { openEditor } from "../../__util__";
import { openSettingsPanel } from "../../__util__";

test("2. Light는 작업 영역·편집기·하단 메뉴·그룹 메뉴를 일관된 밝은 색으로 표시한다", async ({
  page,
}) => {
  await openEditor(page);
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await openSettingsPanel(page);
    await page.getByRole("switch", { name: "Theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.getByRole("button", { name: "Close Settings" }).click();
    await expect(page.locator(".workspace")).toHaveCSS(
      "background-color",
      "rgb(250, 252, 251)",
    );
    await expect(page.locator("textarea")).toHaveCSS(
      "color",
      "rgb(32, 38, 36)",
    );
    await expect(page.locator(".footer")).toHaveCSS(
      "background-color",
      "rgb(240, 244, 241)",
    );
    await page.locator(".group-select-command").press("Enter");
    await expect(page.locator("#groups-menu")).toHaveCSS(
      "background-color",
      "rgb(233, 239, 235)",
    );
    await page.keyboard.press("Escape");
    await openSettingsPanel(page);
    await page.getByRole("switch", { name: "Theme" }).click();
    await expect(page.locator(".workspace")).toHaveCSS(
      "background-color",
      "rgb(17, 17, 16)",
    );
    await page.getByRole("button", { name: "Close Settings" }).click();
  }
});
