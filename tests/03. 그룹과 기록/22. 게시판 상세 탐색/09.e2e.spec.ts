import { expect } from "@playwright/test";

import { boardTest as test } from "../../__fixture__";
import { openBoard, selectBoardPost } from "../../__util__";
test("9. PC 보드 편집기 드래그로 이전과 다음 노트를 본다", async ({
  page,
  boardPost,
}) => {
  await openBoard(page);
  await selectBoardPost(page, boardPost.title, boardPost.id);
  const preview = page.locator(".board-note-preview");
  const box = (await preview.boundingBox())!;
  const y = box.y + 80;
  await page.mouse.move(box.x + box.width * 0.8, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.2, y, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByRole("tab").nth(1)).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.8, y, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByRole("tab").first()).toHaveAttribute(
    "aria-selected",
    "true",
  );
});
