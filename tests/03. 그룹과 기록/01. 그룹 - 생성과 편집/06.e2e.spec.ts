import { expect, test } from "@playwright/test";

import { GROUP_SIDEBAR_MAX_RATIO } from "../../__constant__";
import { groupMenu, groupsCommand } from "../../__util__";

test("6. 그룹 사이드바의 우측 구분선을 드래그해 작업공간과 너비를 조절한다", async ({
  page,
}) => {
  await page.goto("/");
  await groupsCommand(page).click();
  const menu = groupMenu(page);
  const resizer = menu.getByRole("separator", { name: "Resize group panel" });
  const before = (await menu.boundingBox())!;
  const workspaceBefore = (await page.locator(".workspace").boundingBox())!;
  const handle = (await resizer.boundingBox())!;

  await page.mouse.move(handle.x + handle.width / 2, handle.y + 40);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2 + 80, handle.y + 40);
  await page.mouse.up();

  const after = (await menu.boundingBox())!;
  expect(after.width).toBeGreaterThan(before.width);
  const workspaceAfter = (await page.locator(".workspace").boundingBox())!;
  expect(workspaceAfter.x).toBeCloseTo(after.width, 0);
  expect(workspaceAfter.width).toBeLessThan(workspaceBefore.width);
  await page.mouse.move(after.x + after.width, after.y + 40);
  await page.mouse.down();
  await page.mouse.move(1200, after.y + 40);
  await page.mouse.up();
  expect((await menu.boundingBox())!.width).toBeCloseTo(
    Math.floor(1280 * GROUP_SIDEBAR_MAX_RATIO),
    0,
  );
  await page.setViewportSize({ width: 800, height: 800 });
  expect((await menu.boundingBox())!.width).toBeLessThanOrEqual(
    800 * GROUP_SIDEBAR_MAX_RATIO,
  );
  expect((await page.locator(".workspace").boundingBox())!.x).toBeCloseTo(
    (await menu.boundingBox())!.width,
    0,
  );
});
