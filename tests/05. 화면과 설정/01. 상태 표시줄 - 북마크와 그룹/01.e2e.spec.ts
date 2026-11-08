import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import { groupsCommand, moreCommand, systemGroupCommand } from "../../__util__";

test("1. 메뉴 하단에는 그룹 아이콘과 Group Option을 두고 더보기 아이콘은 푸터 우측 끝에 표시한다", async ({
  page,
}) => {
  await page.goto("/");
  await groupsCommand(page).click();
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await expect(
      page.locator("#groups-menu .group-sidebar-header h2"),
    ).toHaveText("Group");
    const row = page.locator(".group-more");
    const group = systemGroupCommand(page);
    const more = moreCommand(page);
    await expect(row.locator(":scope > button")).toHaveText(["Group Option"]);
    await expect(row.locator(".more-command, .group-more-divider")).toHaveCount(
      0,
    );
    const icon = group.locator("svg.lucide-layers");
    await expect(icon).toBeVisible();
    const iconBox = (await icon.boundingBox())!;
    const labelBox = (await group.locator("span").boundingBox())!;
    expect(iconBox.width).toBe(18);
    expect(iconBox.x + iconBox.width).toBeLessThan(labelBox.x);
    expect(iconBox.y + iconBox.height / 2).toBeCloseTo(
      labelBox.y + labelBox.height / 2,
      0,
    );
    await expect(more).toHaveAccessibleName("Menu");
    if (viewport.width > 512)
      await expect(more.locator(".more-command-label")).toBeHidden();
    else await expect(more.locator(".more-command-label")).toBeVisible();
    await expect(more.locator(".more-command-label")).toHaveText("Menu");
    await expect(more.locator("svg.lucide-menu")).toBeVisible();
    const rowBox = (await row.boundingBox())!;
    const groupBox = (await group.boundingBox())!;
    const moreBox = (await more.boundingBox())!;
    const footerBox = (await page.locator(".footer").boundingBox())!;
    expect(groupBox.width).toBeGreaterThan(rowBox.width * 0.85);
    expect(groupBox.x + groupBox.width / 2).toBeCloseTo(
      rowBox.x + rowBox.width / 2,
      0,
    );
    if (viewport.width > 512)
      expect(viewport.width - moreBox.x - moreBox.width).toBeLessThanOrEqual(8);
    else
      expect(moreBox.x + moreBox.width / 2).toBeCloseTo(
        8 + ((viewport.width - 16) * 7) / 8,
        0,
      );
    expect(moreBox.y).toBeGreaterThanOrEqual(footerBox.y);
    expect(moreBox.y + moreBox.height).toBeLessThanOrEqual(
      footerBox.y + footerBox.height,
    );
    expect(rowBox.height).toBeCloseTo(viewport.width > 512 ? 48 : 50.6, 0);
    await group.click();
    await expect(page.locator("#group-system-menu > button")).toHaveText([
      "All Group",

      "Ungrouped",
    ]);
    await more.click();
    await expect(page.locator("#group-system-menu")).toHaveCount(0);
    await expect(
      page.locator("#group-more-menu").getByRole("button"),
    ).toHaveText(["Guide", "Search", "Bookmark", "Settings", "Board"]);
    await page.keyboard.press("Escape");
    await expect(more).toBeFocused();
    await expect(page.locator("#groups-menu")).toBeVisible();
  }
});
