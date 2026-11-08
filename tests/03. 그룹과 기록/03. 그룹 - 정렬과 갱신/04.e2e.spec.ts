import { expect, test } from "@playwright/test";

import {
  authenticateBrowser,
  groupsCommand,
  openMoreMenu,
  openSystemGroupMenu,
} from "../../__util__";

test("4. 사이드바 아래 Group과 More 메뉴에서 기본 그룹과 가이드를 연다", async ({
  page,
}) => {
  await authenticateBrowser(page.context());
  await page.goto("/");
  await groupsCommand(page).click();
  const sidebar = page.locator("#groups-menu");
  const system = sidebar.locator(".group-more");
  const systemGroups = await openSystemGroupMenu(page);
  await expect(systemGroups.locator(":scope > button")).toHaveText([
    "All Group",
    "All My Group",
    "All Shared Group",
    "Ungrouped",
  ]);
  await expect(systemGroups.locator(".group-create-form")).toBeVisible();
  await expect(systemGroups.locator(".group-section-create-form")).toHaveCount(
    0,
  );
  await expect(
    systemGroups.getByRole("textbox", { name: "New group name" }),
  ).toBeVisible();
  const form = systemGroups.locator(".group-create-form");
  const inputBox = (await form.locator("input").boundingBox())!;
  const buttonBox = (await form.locator("button").boundingBox())!;
  expect(inputBox.width).toBeGreaterThanOrEqual(buttonBox.width * 5);
  expect(buttonBox.width).toBeCloseTo(28, 0);
  const sectionBox = (await sidebar.locator(".group-section").boundingBox())!;
  const systemBox = (await system.boundingBox())!;
  expect(systemBox.y).toBeGreaterThanOrEqual(sectionBox.y + sectionBox.height);
  const tools = await openMoreMenu(page);
  await expect(systemGroups).toHaveCount(0);
  await tools.getByRole("button", { name: "Guide" }).click();
  const guide = page.getByRole("dialog");
  await expect(guide.locator(".user-guide-progress")).toHaveText("1 / 11");
  await guide.getByRole("button", { name: "Shortcut" }).click();
  await expect(tools).toHaveCount(0);
  await expect(page.locator("#shortcuts-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
});
