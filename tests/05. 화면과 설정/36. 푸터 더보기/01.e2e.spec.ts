import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import { openMoreMenu } from "../../__util__";

test("1. 설정을 열고 새로고침해도 메뉴 열림과 닫힘을 유지한다", async ({
  page,
}) => {
  await page.goto("/");
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    const sidebar = page.locator("#groups-menu");
    await page.locator(".group-select-command").click();
    await expect(sidebar).toBeVisible();
    const more = await openMoreMenu(page);
    await more.getByRole("button", { name: "Settings", exact: true }).click();
    await expect(page.locator("#settings-panel")).toHaveAttribute(
      "aria-hidden",
      "false",
    );
    await expect(sidebar).toBeVisible();
    await expect(page.locator(".group-select-command")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await page.reload();
    await expect(sidebar).toBeVisible();
    await expect(page.locator("#settings-panel")).toHaveAttribute(
      "aria-hidden",
      "false",
    );
    await page.locator(".group-select-command").click();
    await expect(sidebar).toHaveCount(0);
    await page.reload();
    await expect(page.locator(".group-select-command")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(sidebar).toHaveCount(0);
  }
});
