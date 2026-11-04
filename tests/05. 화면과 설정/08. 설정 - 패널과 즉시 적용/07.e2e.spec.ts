import { expect, test } from "@playwright/test";

import { openSettingsPanel } from "../../__util__";

test("7. Footer Icons Only는 기본 Off이고 PC에만 즉시 적용해 복원한다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 844 });
  await page.goto("/");
  await openSettingsPanel(page);
  const setting = page.locator("#settings-panel");
  const footerSetting = setting
    .locator(".setting-section")
    .filter({ has: page.getByRole("heading", { name: "Footer Icons Only" }) });
  const off = footerSetting.getByRole("radio", { name: "Off", exact: true });
  const on = footerSetting.getByRole("radio", { name: "On", exact: true });
  await expect(off).toBeChecked();
  await expect(page.locator(".footer")).not.toHaveClass(/is-icons-only/);

  await on.check();
  await expect(page.locator(".footer")).toHaveClass(/is-icons-only/);
  await expect(page.locator(".group-command-label")).toBeHidden();
  await expect(page.locator(".dashboard-command .status-label")).toBeHidden();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".group-command-label")).toBeVisible();
  await expect(page.locator(".dashboard-command .status-label")).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 844 });
  await page.reload();
  await expect(page.locator(".footer")).toHaveClass(/is-icons-only/);
  await openSettingsPanel(page);
  await expect(
    page
      .locator("#settings-panel .setting-section")
      .filter({ hasText: "Footer Icons Only" })
      .getByRole("radio", { name: "On", exact: true }),
  ).toBeChecked();
});
