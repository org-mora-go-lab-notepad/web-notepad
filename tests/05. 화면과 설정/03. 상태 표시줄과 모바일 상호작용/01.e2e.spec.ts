import { expect, test } from "@playwright/test";

import { openAddTabCommand } from "../../__util__";

test("1. PC와 모바일 하단 메뉴는 가로 스크롤 없이 정해진 버튼 높이로 표시된다", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".auth-command:not(.is-loading)")).toBeVisible();
  await expect(page.locator(".footer .board-command")).toHaveCount(0);
  const commands = page.locator(
    ".status-meta .status-command:visible, .footer .auth-command:visible",
  );
  for (const width of [320, 390, 512, 513, 640, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    const count = 3;
    await expect(commands).toHaveCount(count);
    const group = (await page.locator(".group-select-command").boundingBox())!;
    const dashboard = (await page.locator(".dashboard-command").boundingBox())!;
    const account = (await page
      .locator(".footer .auth-command")
      .boundingBox())!;
    const dashboardFontSize = await page
      .locator(".dashboard-command > .status-label")
      .evaluate((element) => getComputedStyle(element).fontSize);
    if (width <= 512) expect(dashboardFontSize).toBe("12px");
    for (const label of [
      page.locator(
        width <= 512 ? ".group-command-label" : ".group-current-value",
      ),
      page.locator(".footer .auth-command > span"),
    ]) {
      await expect(label).toHaveCSS("font-size", dashboardFontSize);
      if (width <= 512) await expect(label).toHaveCSS("margin-top", "1px");
    }
    if (width <= 512)
      await expect(
        page.locator(".dashboard-command > .status-label"),
      ).toHaveCSS("margin-top", "1px");
    if (width <= 512) {
      expect(group.x).toBeLessThan(dashboard.x);
      expect(dashboard.x).toBeLessThan(account.x);
    } else {
      expect(group.x).toBeLessThan(dashboard.x);
      expect(dashboard.x).toBeLessThan(account.x);
    }
    for (const command of await commands.all()) {
      await expect(command).toBeInViewport();
      const bounds = (await command.boundingBox())!;
      expect(bounds.height).toBeCloseTo(width <= 512 ? 61.2 : 35, 1);
    }
    if (width <= 512) {
      const footerHeight = (await page.locator(".footer").boundingBox())!
        .height;
      expect(footerHeight).toBeCloseTo(81.8, 1);
      const userImage = page.locator(
        '.footer .auth-command[aria-haspopup="menu"] > img',
      );
      if (await userImage.count()) {
        const imageBounds = (await userImage.boundingBox())!;
        expect(imageBounds.width).toBeCloseTo(30.8, 1);
        expect(imageBounds.height).toBeCloseTo(30.8, 1);
      }
      const centers = (
        await Promise.all(
          (await commands.all()).map(async (command) => {
            const bounds = (await command.boundingBox())!;
            return bounds.x + bounds.width / 2;
          }),
        )
      ).sort((left, right) => left - right);
      const gaps = centers
        .slice(1)
        .map((center, index) => center - centers[index]);
      expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThanOrEqual(1);
    }
    expect(
      await page
        .locator(".footer")
        .evaluate((bar) => bar.scrollWidth <= bar.clientWidth),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".group-select-command").click();
  await expect(page.locator("#groups-menu")).toBeVisible();
  await expect(page.locator(".footer")).toBeVisible();
  await expect(page.locator(".mobile-tap-feedback")).toHaveCount(0);
  await page.locator(".group-select-command").click();
  await expect(page.locator("#groups-menu")).toHaveCount(0);
  const dashboardIconBounds = (await page
    .locator(".dashboard-command svg")
    .boundingBox())!;
  const expectedFeedbackSize =
    Math.max(
      40,
      Math.max(dashboardIconBounds.width, dashboardIconBounds.height) + 16,
    ) * 1.2;
  await page.evaluate(() => {
    const state = window as typeof window & {
      __tapFeedbackSeen?: number;
      __tapFeedbackSize?: number;
    };
    state.__tapFeedbackSeen = 0;
    state.__tapFeedbackSize = 0;
    const observer = new MutationObserver((records) => {
      for (const record of records)
        for (const node of record.addedNodes)
          if (
            node instanceof Element &&
            node.classList.contains("mobile-tap-feedback")
          ) {
            state.__tapFeedbackSeen = (state.__tapFeedbackSeen ?? 0) + 1;
            state.__tapFeedbackSize = Number.parseFloat(
              (node as HTMLElement).style.width,
            );
          }
    });
    observer.observe(document.body, { childList: true });
    window.setTimeout(() => observer.disconnect(), 1000);
  });
  await (await openAddTabCommand(page)).click();
  expect(
    await page.evaluate(
      () =>
        (window as typeof window & { __tapFeedbackSeen?: number })
          .__tapFeedbackSeen ?? 0,
    ),
  ).toBe(0);
  await page.locator(".dashboard-preview .bottom-sheet-header button").click();
  await page.locator(".dashboard-command").click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { __tapFeedbackSeen?: number })
            .__tapFeedbackSeen ?? 0,
      ),
    )
    .toBeGreaterThan(0);
  expect(
    await page.evaluate(
      () =>
        (window as typeof window & { __tapFeedbackSize?: number })
          .__tapFeedbackSize ?? 0,
    ),
  ).toBeCloseTo(expectedFeedbackSize, 1);
  await expect(page.locator("#groups-menu")).toHaveCount(0);
  await expect(page.locator("#dashboard-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  await expect(page.locator(".footer")).toBeVisible();
  await expect(page.locator(".mobile-tap-feedback")).toHaveCount(0);
});
