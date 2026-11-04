import { expect, test } from "@playwright/test";

import { openPanel } from "../../__util__";

test("8. PC 그룹과 카드 헤더 아이콘은 hover에서만 테두리를 표시한다", async ({
  page,
}) => {
  await page.goto("/");
  await openPanel(page, "dashboard-panel");
  await page.locator(".group-select-command").click();
  const buttons = page.locator(
    ".group-sidebar-header > button, #dashboard-panel .side-panel-header .side-panel-action, #dashboard-panel .side-panel-close",
  );
  await expect(buttons).toHaveCount(4);
  for (const button of await buttons.all()) {
    await page.mouse.move(0, 0);
    await expect(button).toHaveCSS("border-top-color", "rgba(0, 0, 0, 0)");
    const before = (await button.boundingBox())!;
    await button.hover();
    await expect(button).not.toHaveCSS("border-top-color", "rgba(0, 0, 0, 0)");
    const after = (await button.boundingBox())!;
    expect(after).toEqual(before);
    await page.mouse.move(0, 0);
    await expect(button).toHaveCSS("border-top-color", "rgba(0, 0, 0, 0)");
  }
  const options = page.locator(".dashboard-options-trigger");
  await options.click();
  await page.mouse.move(0, 0);
  await expect(options).toHaveAttribute("aria-expanded", "true");
  await expect(options).toHaveCSS("border-top-color", "rgba(0, 0, 0, 0)");
  await page.keyboard.press("Escape");
  await expect(options).toHaveCSS("outline-style", "solid");
});
