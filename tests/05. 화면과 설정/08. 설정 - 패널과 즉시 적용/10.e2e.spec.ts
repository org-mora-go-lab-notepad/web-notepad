import { expect, test } from "@playwright/test";

import {
  groupsCommand,
  openSettingsPanel,
  readStoredState,
} from "../../__util__";

test.use({
  isMobile: true,
  hasTouch: true,
  viewport: { width: 390, height: 844 },
});

test("10. 모바일 오른쪽 그룹은 화면 너비를 채우고 푸터를 가리지 않는다", async ({
  page,
}) => {
  await page.goto("/");
  await openSettingsPanel(page);
  await page
    .getByRole("radiogroup", { name: "Group Position", exact: true })
    .getByRole("radio", { name: "Right", exact: true })
    .check();
  await page.keyboard.press("Escape");
  await groupsCommand(page).tap();
  const group = page.locator("#groups-menu");
  await expect(group).toBeVisible();
  const g = (await group.boundingBox())!;
  const f = (await page.locator(".footer").boundingBox())!;
  expect(g.x).toBe(0);
  expect(g.width).toBe(390);
  expect(g.y + g.height).toBeCloseTo(f.y, 0);
  await expect(group.locator(".group-menu-resizer")).toBeHidden();
  await groupsCommand(page).tap();
  await expect(group).toHaveCount(0);
  expect((await readStoredState(page)).settings?.groupPosition).toBe("right");
  await expect(page.locator(".workspace")).toHaveCSS("margin-left", "0px");
});
