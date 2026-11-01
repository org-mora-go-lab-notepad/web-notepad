import { expect, test } from "@playwright/test";

import { createGroupFixture, createTabFixture } from "../../__fixture__";
import {
  groupsCommand,
  openSystemGroupMenu,
  seedStoredStateOnLoad,
} from "../../__util__";

test("6. 오늘 생성되거나 변경된 그룹이 있으면 Group 아이콘에 붉은 점을 표시한다", async ({
  page,
}) => {
  const yesterday = Date.now() - 24 * 60 * 60 * 1000;
  await seedStoredStateOnLoad(page, {
    groups: [
      createGroupFixture(
        "ungrouped",
        "Ungrouped",
        [createTabFixture("tab-1", "Alpha task")],
        { createdAt: yesterday, updatedAt: yesterday },
      ),
    ],
  });
  const command = groupsCommand(page);
  const dot = command.locator(".status-dot");
  await expect(dot).toHaveCount(0);

  await command.click();
  await openSystemGroupMenu(page);
  await page.getByRole("textbox", { name: "New group name" }).fill("Work");
  await page.getByRole("button", { name: "Create group" }).click();

  await expect(dot).toBeVisible();
  await expect(dot).toHaveCSS("border-radius", "50%");
  await expect(dot).toHaveCSS("background-color", "rgb(255, 92, 92)");
});
