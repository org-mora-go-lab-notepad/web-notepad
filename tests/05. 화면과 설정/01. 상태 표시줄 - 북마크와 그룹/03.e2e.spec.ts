import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import { groupsCommand } from "../../__util__";

test("3. 현재 그룹은 PC 푸터 왼쪽, 모바일 메뉴 버튼에 표시한다", async ({
  page,
}) => {
  await page.goto("/");
  const command = groupsCommand(page);
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await expect(command.locator("svg.lucide-layers")).toBeVisible();
    await expect(command.locator(".status-count")).toHaveCount(0);
    await expect(page.locator(".group-status-command")).toHaveCount(0);
    await expect(command).toHaveAttribute("aria-label", "Toggle groups");
    const groupBox = (await command.boundingBox())!;
    const dashboardBox = (await page
      .locator(".dashboard-command")
      .boundingBox())!;
    expect(groupBox.x).toBeLessThan(dashboardBox.x);

    if (viewport.width <= 512) {
      await expect(page.locator(".footer-current-group")).toBeHidden();
      await expect(command).toHaveCSS("gap", "4px");
      await expect(command.locator(".group-command-label")).toBeHidden();
      await expect(command.locator(".group-current-value")).toHaveText(
        "Ungrouped",
      );
      await expect(command.locator(".group-current-value")).toBeVisible();
      await expect(page.locator(".current-group-panel")).toHaveCount(0);
    } else {
      const currentGroup = page.locator(".footer-current-group");
      await expect(currentGroup).toHaveText("Ungrouped");
      await expect(currentGroup).toBeVisible();
      const commandFontSize = Number.parseFloat(
        await command
          .locator(".group-command-label")
          .evaluate((element) => getComputedStyle(element).fontSize),
      );
      const currentGroupFontSize = Number.parseFloat(
        await currentGroup.evaluate(
          (element) => getComputedStyle(element).fontSize,
        ),
      );
      expect(currentGroupFontSize).toBeCloseTo(commandFontSize + 2, 1);
      expect((await currentGroup.boundingBox())!.x).toBeCloseTo(16, 0);
      await expect(currentGroup).toHaveAttribute("aria-expanded", "false");
      await currentGroup.click();
      await expect(page.locator("#groups-menu")).toBeVisible();
      await expect(currentGroup).toHaveAttribute("aria-expanded", "true");
      await currentGroup.click();
      await expect(page.locator("#groups-menu")).toHaveCount(0);
      await expect(currentGroup).toHaveAttribute("aria-expanded", "false");
      await expect(command).toHaveCSS("gap", "7px");
      await expect(command.locator(".group-current-value")).toBeHidden();
      await expect(command.locator(".group-command-label")).toHaveText("Group");
      await expect(command.locator(".group-command-label")).toBeVisible();
      await expect(page.locator(".current-group-panel")).toHaveCount(0);
    }
  }
});
