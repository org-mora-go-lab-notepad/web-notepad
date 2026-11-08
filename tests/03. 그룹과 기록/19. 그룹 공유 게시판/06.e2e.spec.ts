import { expect } from "@playwright/test";

import { boardTest as test } from "../../__fixture__";
import { openBoard, selectBoardPost } from "../../__util__";

test("6. 작은 모바일과 라이트 테마에서 목록과 초대 링크 복사 버튼이 화면 안에 표시된다", async ({
  page,
  boardPost,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  await page.evaluate(() =>
    document.documentElement.setAttribute("data-theme", "light"),
  );
  await openBoard(page);
  await selectBoardPost(page, boardPost.title);
  const blurEffects = await page.evaluate(() => ({
    header: getComputedStyle(
      document.querySelector(".fixed-page-header")!,
      "::after",
    ).backdropFilter,
    footer: getComputedStyle(
      document.querySelector(".board-mobile-footer .footer")!,
      "::before",
    ).backdropFilter,
  }));
  expect(blurEffects.header).toContain("blur(2px)");
  expect(blurEffects.footer).toContain("blur(2px)");
  await expect(page.getByTestId("board-note-resizer")).toHaveCount(0);
  const button = page.getByRole("button", { name: "Copy Invitation Link" });
  await button.scrollIntoViewIfNeeded();
  const box = (await button.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(320);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
});
