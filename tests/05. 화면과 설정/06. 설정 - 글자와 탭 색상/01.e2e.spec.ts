import { expect, test } from "@playwright/test";

import { openMoreMenu } from "../../__util__";
import { settingsPanel } from "../__util__";

test("1. More의 Settings를 선택하면 사이드바를 닫고 설정 패널을 연다", async ({
  page,
}) => {
  await page.goto("/");
  const tools = await openMoreMenu(page);
  const settings = tools.getByRole("button", { name: "Settings" });
  await expect(settings).toContainText("Settings");
  await expect(settings.locator("svg")).toHaveClass(/lucide-settings/);
  await settings.click();

  await expect(settingsPanel(page)).toHaveAttribute("aria-hidden", "false");
  await expect(settingsPanel(page)).toBeInViewport();
  await expect(page.locator("#groups-menu")).toHaveCount(0);
  await expect(
    settingsPanel(page).getByRole("heading", { name: "Settings" }),
  ).toBeVisible();
  await expect(
    settingsPanel(page).getByRole("heading", { name: "Font Size" }),
  ).toBeVisible();
  await expect(
    settingsPanel(page).getByRole("heading", { name: "Tab Colors" }),
  ).toBeVisible();
});
