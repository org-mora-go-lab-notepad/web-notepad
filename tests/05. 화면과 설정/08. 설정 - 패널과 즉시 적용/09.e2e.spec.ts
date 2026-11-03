import { expect, test } from "@playwright/test";

import { groupsCommand, openSettingsPanel } from "../../__util__";

test("9. 오른쪽 그룹 패널은 왼쪽 경계에서 크기를 조절하고 새로고침 후 너비를 유지한다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await openSettingsPanel(page);
  await page
    .getByRole("radiogroup", { name: "Group Position", exact: true })
    .getByRole("radio", { name: "Right", exact: true })
    .check();
  await page.keyboard.press("Escape");
  await groupsCommand(page).click();
  const group = page.locator("#groups-menu");
  const before = (await group.boundingBox())!;
  const handle = (await group.locator(".group-menu-resizer").boundingBox())!;
  expect(Math.abs(handle.x + handle.width / 2 - before.x)).toBeLessThanOrEqual(
    1,
  );
  await page.mouse.move(handle.x + handle.width / 2, handle.y + 100);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2 - 80, handle.y + 100, {
    steps: 8,
  });
  await page.mouse.up();
  await expect
    .poll(async () => (await group.boundingBox())!.width)
    .toBeCloseTo(before.width + 80, 0);
  await page.reload();
  await expect(group).toBeVisible();
  const after = (await group.boundingBox())!;
  expect(after.width).toBeCloseTo(before.width + 80, 0);
  expect(after.x + after.width).toBeCloseTo(1280, 0);
  await group.locator(".system-group-command").click();
  const menu = (await page.locator("#group-system-menu").boundingBox())!;
  expect(menu.x + menu.width).toBeLessThanOrEqual(1280);
});
