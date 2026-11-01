import { expect, test } from "@playwright/test";

import { DESKTOP_VIEWPORT } from "../../__constant__";
import { openGlobalSearchPanel, openPanel } from "../../__util__";
import { workspaceBounds } from "../__util__";

test("4. 검색 팝업을 열고 닫아도 고정 대시보드를 유지한다", async ({
  page,
}) => {
  await page.setViewportSize(DESKTOP_VIEWPORT);
  await page.goto("/");
  await openPanel(page, "dashboard-panel");
  const pinnedWorkspaceWidth = (await workspaceBounds(page)).width;
  await page.locator(".group-select-command").click();
  await openGlobalSearchPanel(page);
  const workspaceWidthWithMenu = (await workspaceBounds(page)).width;

  await expect(page.locator("#dashboard-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  expect((await workspaceBounds(page)).width).toBeCloseTo(
    workspaceWidthWithMenu,
    0,
  );

  await page.locator(".global-search-close").click();
  await expect(page.locator("#global-search-popup")).not.toHaveAttribute(
    "open",
    "",
  );
  await expect(page.locator("#dashboard-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  expect(workspaceWidthWithMenu).toBeLessThan(pinnedWorkspaceWidth);
  expect((await workspaceBounds(page)).width).toBeCloseTo(
    workspaceWidthWithMenu,
    0,
  );
});
