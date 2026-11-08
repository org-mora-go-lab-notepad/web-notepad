import { expect, test } from "@playwright/test";

import { signedSession } from "../../__fixture__";
import { authenticateBrowser } from "../../__util__";

test("6. 모바일 네 푸터 진입점은 로그인 전후 같은 간격이며 더보기를 1.2배 표시한다", async ({
  page,
  context,
}) => {
  for (const loggedIn of [false, true]) {
    if (loggedIn) {
      await authenticateBrowser(
        context,
        signedSession({
          id: "footer-spacing",
          nickname: "Long account name",
          expiresAt: Date.now() + 300000,
        }),
      );
    }
    await page.goto("/");
    await expect(
      page.locator(
        loggedIn ? ".footer button.auth-command" : ".footer a.auth-command",
      ),
    ).toBeVisible();
    for (const width of [320, 390, 512]) {
      await page.setViewportSize({ width, height: 844 });
      const commands = page.locator(
        ".footer .group-select-command, .footer .dashboard-command, .footer .auth-command:not(.is-loading), .footer .more-command",
      );
      await expect(commands).toHaveCount(4);
      await expect(commands.nth(2)).toBeVisible();
      const boxes = await commands.evaluateAll((elements) =>
        elements.map((element) => {
          const rect = element.getBoundingClientRect();
          return { center: rect.x + rect.width / 2, width: rect.width };
        }),
      );
      const interval = (width - 16) / 4;
      for (let index = 0; index < boxes.length; index++) {
        expect(boxes[index].width, `entry ${index} at ${width}px`).toBeCloseTo(
          interval,
          0,
        );
        expect(
          boxes[index].center,
          `center ${index} at ${width}px`,
        ).toBeCloseTo(8 + interval * (index + 0.5), 0);
      }
      const moreIcon = (await page
        .locator(".footer .more-command > svg")
        .boundingBox())!;
      expect(moreIcon.width).toBeCloseTo(24 * 1.2, 1);
      expect(moreIcon.height).toBeCloseTo(24 * 1.2, 1);
      const more = page.locator(".footer .more-command");
      await expect(more.locator("svg.lucide-menu")).toBeVisible();
      await expect(
        page.locator(".footer .group-select-command svg.lucide-layers"),
      ).toBeVisible();
      const label = more.locator(".more-command-label");
      await expect(label).toBeVisible();
      await expect(label).toHaveText("Menu");
      await expect(more.locator("svg")).toHaveCSS(
        "transform",
        "matrix(1, 0, 0, 1, 0, -3)",
      );
      const labelBox = (await label.boundingBox())!;
      expect(labelBox.y).toBeGreaterThan(moreIcon.y + moreIcon.height);
      expect(labelBox.x + labelBox.width / 2).toBeCloseTo(boxes[3].center, 0);
      const cardLabel = page.locator(
        ".footer .dashboard-command .status-label",
      );
      for (const property of ["font-size", "line-height"]) {
        expect(
          await label.evaluate(
            (element, property) =>
              getComputedStyle(element).getPropertyValue(property),
            property,
          ),
        ).toBe(
          await cardLabel.evaluate(
            (element, property) =>
              getComputedStyle(element).getPropertyValue(property),
            property,
          ),
        );
      }
      expect(width - boxes[3].center).toBeGreaterThan(interval / 2);
      await page.locator(".footer .more-command").click();
      await expect(page.locator("#group-more-menu")).toBeVisible();
      const menu = (await page.locator("#group-more-menu").boundingBox())!;
      expect(menu.x).toBeGreaterThanOrEqual(0);
      expect(menu.x + menu.width).toBeLessThanOrEqual(width);
      await page.keyboard.press("Escape");
    }
  }
});
