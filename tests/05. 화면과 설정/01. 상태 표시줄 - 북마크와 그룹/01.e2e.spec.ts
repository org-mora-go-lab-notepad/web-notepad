import { expect, test } from "@playwright/test";

import { DESKTOP_VIEWPORT, MOBILE_VIEWPORT } from "../../__constant__";
import { groupsCommand, moreCommand, systemGroupCommand } from "../../__util__";

test("1. PC와 모바일에서 더보기 버튼과 가이드·검색·북마크 메뉴를 표시한다", async ({
  page,
}) => {
  await page.goto("/");
  await groupsCommand(page).click();
  const label = moreCommand(page).locator("span");
  const icon = moreCommand(page).locator("svg").first();

  await page.setViewportSize(DESKTOP_VIEWPORT);
  await expect(label).toHaveText("More");
  await expect(label).toBeInViewport();
  await expect(page.locator(".group-board-command")).toHaveCount(0);
  await expect(systemGroupCommand(page).locator("svg")).toBeHidden();
  await expect(icon).toBeHidden();
  for (const command of [systemGroupCommand(page), moreCommand(page)]) {
    await expect(command).toHaveCSS("font-size", "13.5px");
  }
  for (const command of [systemGroupCommand(page), moreCommand(page)]) {
    const hoverWidthRatio = await command.evaluate((element) => {
      const commandWidth = element.getBoundingClientRect().width;
      const hoverWidth = Number.parseFloat(
        getComputedStyle(element, "::before").width,
      );
      return hoverWidth / commandWidth;
    });
    expect(hoverWidthRatio).toBeCloseTo(0.88, 1);
  }
  await expect(page.locator(".footer .dashboard-command svg")).toHaveCSS(
    "width",
    "25px",
  );
  await expect(page.locator(".group-more")).toHaveCSS(
    "border-top-width",
    "1px",
  );
  const groupMenuRowLocator = page.locator(".group-more");
  const groupMenuRow = (await groupMenuRowLocator.boundingBox())!;
  const groupMenuContentWidth = await groupMenuRowLocator.evaluate(
    (element) => element.clientWidth,
  );
  const desktopGroupLabel = (await systemGroupCommand(page)
    .locator("span")
    .boundingBox())!;
  const desktopMoreLabel = (await label.boundingBox())!;
  const desktopGroupCommand = (await systemGroupCommand(page).boundingBox())!;
  const desktopMoreCommand = (await moreCommand(page).boundingBox())!;
  expect(desktopGroupCommand.x).toBeCloseTo(groupMenuRow.x + 5, 1);
  expect(desktopGroupLabel.x + desktopGroupLabel.width / 2).toBeCloseTo(
    desktopGroupCommand.x + desktopGroupCommand.width / 2,
    1,
  );
  expect(desktopMoreLabel.x + desktopMoreLabel.width / 2).toBeCloseTo(
    desktopMoreCommand.x + desktopMoreCommand.width / 2,
    1,
  );
  expect(desktopMoreCommand.x + desktopMoreCommand.width).toBeCloseTo(
    groupMenuRow.x + groupMenuContentWidth - 5,
    1,
  );
  const statusBar = (await page.locator(".footer").boundingBox())!;
  expect(groupMenuRow.height).toBe(statusBar.height);

  await page.setViewportSize(MOBILE_VIEWPORT);
  const mobileGroupMenuRow = (await page.locator(".group-more").boundingBox())!;
  expect(mobileGroupMenuRow.height).toBeCloseTo(50.6, 0);
  const dashboardBounds = (await page
    .locator(".footer .dashboard-command svg")
    .boundingBox())!;
  expect(dashboardBounds.width).toBeCloseTo(29.8, 1);
  await expect(label).toBeInViewport();
  await expect(systemGroupCommand(page).locator("svg")).toBeHidden();
  await expect(icon).toBeHidden();
  for (const command of [systemGroupCommand(page), moreCommand(page)]) {
    const alignment = await command.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const text = element.querySelector("span")!.getBoundingClientRect();
      return {
        commandCenter: bounds.left + bounds.width / 2,
        contentCenter: text.left + text.width / 2,
      };
    });
    expect(alignment.contentCenter).toBeCloseTo(alignment.commandCenter, 1);
  }
  const systemBox = (await systemGroupCommand(page).boundingBox())!;
  const firstDividerBox = (await page
    .locator(".group-more-divider")
    .nth(0)
    .boundingBox())!;
  const moreBox = (await moreCommand(page).boundingBox())!;
  const menuBounds = (await page.locator(".group-menu").boundingBox())!;
  const controlsCenter = (systemBox.x + moreBox.x + moreBox.width) / 2;
  expect(controlsCenter).toBeCloseTo(
    menuBounds.x + menuBounds.width / 2 - 5,
    1,
  );
  expect(systemBox.x + systemBox.width).toBeLessThanOrEqual(firstDividerBox.x);
  expect(firstDividerBox.x + firstDividerBox.width).toBeLessThanOrEqual(
    moreBox.x,
  );

  await systemGroupCommand(page).click();
  const mobileSystemMenu = (await page
    .locator("#group-system-menu")
    .boundingBox())!;
  expect(mobileSystemMenu.width).toBeLessThanOrEqual(
    MOBILE_VIEWPORT.width * 0.7,
  );
  await expect(page.locator("#group-system-menu > button")).toHaveText([
    "All Group",
    "All My Group",
    "All Shared Group",
    "Ungrouped",
  ]);
  await moreCommand(page).click();
  await expect(page.locator("#group-system-menu")).toHaveCount(0);
  await expect(page.locator("#group-more-menu").getByRole("button")).toHaveText(
    ["Guide", "Search", "Bookmark", "Settings"],
  );
});
