import { expect, test } from "@playwright/test";

import { dashboardColumn, openPanel } from "../../__util__";
import { seedCards } from "./__util__";

test.use({
  isMobile: true,
  hasTouch: true,
  viewport: { width: 390, height: 900 },
});
test("2. 모바일 길게 누른 카드도 같은 상태 안에서 순서를 변경한다", async ({
  page,
}) => {
  await seedCards(page);
  await openPanel(page, "dashboard-panel");
  const cards = dashboardColumn(page, "todo").locator(".dashboard-card");
  await cards.filter({ hasText: "Gamma" }).scrollIntoViewIfNeeded();
  await cards.filter({ hasText: "Gamma" }).click({ trial: true });
  const source = (await cards.filter({ hasText: "Gamma" }).boundingBox())!;
  const target = (await cards.filter({ hasText: "Alpha" }).boundingBox())!;
  const session = await page.context().newCDPSession(page);
  try {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        { x: source.x + source.width / 2, y: source.y + source.height / 2 },
      ],
    });
    await expect(cards.filter({ hasText: "Gamma" })).toHaveClass(/is-dragging/);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: target.x + target.width / 2, y: target.y + 8 }],
    });
    await expect(cards.filter({ hasText: "Alpha" })).toHaveAttribute(
      "data-drop-placement",
      "before",
    );
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect(cards.locator("strong")).toHaveText([
      "Gamma",
      "Alpha",
      "Beta",
    ]);
    await expect(page.locator("textarea:focus")).toHaveCount(0);
  } finally {
    await session.detach();
  }
});
