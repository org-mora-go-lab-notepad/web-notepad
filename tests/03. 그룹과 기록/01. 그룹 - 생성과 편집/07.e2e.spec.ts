import { expect, test } from "@playwright/test";

import { GROUP_OPTION_WIDTH_SCALE } from "../../__constant__";
import { openSystemGroupMenu, readStoredState } from "../../__util__";

test("7. Group Option 폭은 기존보다 10퍼센트 작으며 입력창과 추가 버튼이 잘리지 않는다", async ({
  page,
}) => {
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const menu = await openSystemGroupMenu(page);
    await expect(menu).toBeVisible();
    const bounds = (await menu.boundingBox())!;
    const original =
      (width <= 512 ? (width - 38) * 0.7 : Math.min(260, width - 38)) + 12;
    expect(bounds.width).toBeCloseTo(original * GROUP_OPTION_WIDTH_SCALE, 0);
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    const input = menu.getByRole("textbox", { name: "New group name" });
    const add = menu.getByRole("button", { name: "Create group", exact: true });
    const field = (await input.boundingBox())!,
      button = (await add.boundingBox())!;
    expect(field.width).toBeGreaterThan(button.width * 2);
    expect(button.x + button.width).toBeLessThan(bounds.x + bounds.width);
    await input.fill(`Compact group ${width}`);
    await add.click();
    await expect
      .poll(async () =>
        (await readStoredState(page)).groups.some(
          (group) => group.name === `Compact group ${width}`,
        ),
      )
      .toBe(true);
  }
});
