import { expect, test } from "@playwright/test";

import { groupMenu, groupsCommand, openSystemGroupMenu } from "../../__util__";

test("1. 하단 Group 버튼은 작업공간 왼쪽에 그룹 사이드바를 연다", async ({
  page,
}) => {
  await page.goto("/");
  await groupsCommand(page).click();
  await expect(groupMenu(page)).toBeVisible();
  await expect(groupMenu(page).locator(".group-create-form")).toHaveCount(0);
  await expect(
    (await openSystemGroupMenu(page)).locator(".group-create-form"),
  ).toHaveCSS("border-top-width", "1px");
  const menuBox = (await groupMenu(page).boundingBox())!;
  const workspaceBox = (await page.locator(".workspace").boundingBox())!;
  const footerBox = (await page.locator(".footer").boundingBox())!;
  expect(menuBox.x).toBe(0);
  expect(menuBox.height).toBe(
    (await page.evaluate(() => innerHeight)) - footerBox.height,
  );
  expect(menuBox.y + menuBox.height).toBeCloseTo(footerBox.y, 0);
  expect(workspaceBox.x).toBeCloseTo(menuBox.width, 0);
});
