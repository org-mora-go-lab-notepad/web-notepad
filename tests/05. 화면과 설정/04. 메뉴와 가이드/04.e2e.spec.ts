import { expect, test } from "@playwright/test";

import { openMoreMenu } from "../../__util__";

test("4. Menu는 Theme와 다섯 명령을 순서대로 표시하고 Tab으로 탐색한다", async ({
  page,
}) => {
  await page.goto("/");
  const menu = await openMoreMenu(page);
  const theme = menu.getByRole("switch", { name: "Theme", exact: true });
  const buttons = menu.getByRole("button");
  await expect(buttons).toHaveText([
    "Guide",
    "Search",
    "Bookmark",
    "Settings",
    "Board",
  ]);
  const first = menu.locator(":scope > *").first();
  await expect(first).toHaveClass(/theme/);
  await theme.focus();
  await expect(theme).toBeFocused();
  for (let index = 0; index < 5; index++) {
    await page.keyboard.press("Tab");
    await expect(buttons.nth(index)).toBeFocused();
  }
  await page.keyboard.press("Home");
  await expect(theme).toBeFocused();
  await page.keyboard.press("End");
  await expect(buttons.last()).toHaveText("Board");
  await expect(buttons.last()).toBeFocused();
});
