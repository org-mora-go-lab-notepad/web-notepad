import { expect, test } from "@playwright/test";

import {
  groupsCommand,
  openSettingsPanel,
  readStoredState,
} from "../../__util__";

test("4. Group Position의 Right 선택을 저장하고 새로고침 후 그룹 패널 위치를 복원한다", async ({
  page,
}) => {
  await page.goto("/");
  await openSettingsPanel(page);
  const panel = page.locator("#settings-panel");
  const position = panel.getByRole("radiogroup", {
    name: "Group Position",
    exact: true,
  });
  await position.getByRole("radio", { name: "Right", exact: true }).check();
  await expect(page.locator(".home")).toHaveAttribute(
    "data-group-position",
    "right",
  );
  await expect
    .poll(async () => (await readStoredState(page)).settings?.groupPosition)
    .toBe("right");
  await page.reload();
  await expect(
    position.getByRole("radio", { name: "Right", exact: true }),
  ).toBeChecked();
  await expect(
    panel
      .getByRole("radiogroup", { name: "Panel Position", exact: true })
      .getByRole("radio", { name: "Right", exact: true }),
  ).toBeChecked();
  await page.keyboard.press("Escape");
  await groupsCommand(page).click();
  const bounds = (await page.locator("#groups-menu").boundingBox())!;
  expect(bounds.x + bounds.width).toBeCloseTo(page.viewportSize()!.width, 0);
  expect(bounds.x).toBeGreaterThan(0);
  await expect(page.locator(".workspace")).toHaveCSS("margin-left", "0px");
});
