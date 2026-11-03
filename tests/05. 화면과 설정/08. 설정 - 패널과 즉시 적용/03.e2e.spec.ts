import { expect, test } from "@playwright/test";

import { openPanel, openSettingsPanel } from "../../__util__";

test("3. Panel Position의 기본 Right와 Left 선택을 모든 사이드 패널에 즉시 적용한다", async ({
  page,
}) => {
  await page.goto("/");
  await openSettingsPanel(page);
  const settings = page.locator("#settings-panel");
  await expect(
    settings
      .getByRole("radiogroup", { name: "Panel Position", exact: true })
      .getByRole("radio", { name: "Right", exact: true }),
  ).toBeChecked();
  await expect(settings.locator(".setting-section h3").nth(5)).toHaveText(
    "Panel Position",
  );
  await settings
    .getByRole("radiogroup", { name: "Panel Position", exact: true })
    .getByRole("radio", { name: "Left", exact: true })
    .check();
  await expect(page.locator(".home")).toHaveAttribute(
    "data-panel-position",
    "left",
  );
  expect((await settings.boundingBox())!.x).toBe(0);
  await settings
    .getByRole("button", { name: "Close Settings", exact: true })
    .click();

  for (const id of ["dashboard-panel", "settings-panel"]) {
    await openPanel(page, id);
    expect((await page.locator(`#${id}`).boundingBox())!.x).toBe(0);
    await page.keyboard.press("Escape");
  }
});
