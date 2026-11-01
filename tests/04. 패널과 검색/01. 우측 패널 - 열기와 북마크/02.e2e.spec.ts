import { expect, test } from "@playwright/test";

import { openSettingsPanel, openShortcutsPanel } from "../../__util__";

test("2. 하단 더보기 Settings와 가이드 Shortcut 진입점으로 패널을 연다", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.locator('.footer [aria-controls="shortcuts-panel"]'),
  ).toHaveCount(0);

  await openShortcutsPanel(page);
  await expect(page.locator("#shortcuts-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  await page.getByRole("button", { name: "Close Shortcut (mac)" }).click();
  await openSettingsPanel(page);
  await expect(page.locator("#settings-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  await page.getByRole("button", { name: "Close Settings" }).click();
});
