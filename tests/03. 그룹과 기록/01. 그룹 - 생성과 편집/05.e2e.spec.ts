import { expect, test } from "@playwright/test";

import { GROUP_SIDEBAR_MAX_RATIO } from "../../__constant__";
import { groupMenu, groupsCommand } from "../../__util__";

test("5. PC 그룹 사이드바는 기본 280px을 최대 폭 안에서 사용하고 모바일은 전체 너비를 사용한다", async ({
  page,
}) => {
  await page.goto("/");
  await groupsCommand(page).click();
  expect((await groupMenu(page).boundingBox())!.width).toBe(280);

  await page.setViewportSize({ width: 513, height: 800 });
  expect((await groupMenu(page).boundingBox())!.width).toBeCloseTo(
    513 * GROUP_SIDEBAR_MAX_RATIO,
    1,
  );

  await page.setViewportSize({ width: 512, height: 800 });
  expect((await groupMenu(page).boundingBox())!.width).toBe(512);

  await page.setViewportSize({ width: 360, height: 800 });
  expect((await groupMenu(page).boundingBox())!.width).toBe(360);
});
