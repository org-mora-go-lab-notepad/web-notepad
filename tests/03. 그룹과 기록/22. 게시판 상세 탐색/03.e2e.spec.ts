import { expect } from "@playwright/test";

import { boardTest as test } from "../../__fixture__";
import { openBoard, selectBoardPost, swipeTouch } from "../../__util__";

test.use({
  isMobile: true,
  hasTouch: true,
  viewport: { width: 390, height: 844 },
});

test("3. 모바일 보드 상세 푸터 제스처는 노트 탭을 순환하고 첫 탭이 즉시 동작한다", async ({
  page,
  boardPost,
}) => {
  await openBoard(page);
  await selectBoardPost(page, boardPost.title, boardPost.id);
  const footer = page.locator(".board-mobile-footer .footer");
  const dashboard = page.locator(".board-mobile-footer .dashboard-command");
  const tabs = page.getByRole("tab");
  await expect(page.locator(".board-note-preview")).toBeVisible();
  const firstTabName = await tabs.first().textContent();
  const secondTabName = await tabs.nth(1).textContent();
  await expect(footer).toBeVisible();
  await expect(dashboard).toBeVisible();
  await swipeTouch(footer, "left");
  await expect(page.getByRole("tab", { selected: true })).toHaveText(
    secondTabName ?? "",
  );
  await expect(tabs.nth(1)).toBeInViewport();

  await swipeTouch(footer, "right");
  await expect(page.getByRole("tab", { selected: true })).toHaveText(
    firstTabName ?? "",
  );

  await swipeTouch(footer, "left");
  await expect(page.getByRole("tab", { selected: true })).toHaveText(
    secondTabName ?? "",
  );
  // The next real touch is an independent user event and must not be consumed
  // by the preceding footer swipe.
  await page.evaluate(() => {
    document.addEventListener(
      "click",
      (event) => {
        if (
          event.isTrusted &&
          event.target instanceof Element &&
          event.target.closest(".footer")
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      true,
    );
  });
  await dashboard.tap();

  await expect(page).toHaveURL(/[?&]panel=dashboard(?:&|$)/);
  await expect(page.locator("#dashboard-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
});
