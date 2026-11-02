import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";
import { addTabButton } from "../../__util__";

test("4. 탭 제목을 편집기 하단으로 직접 드래그해 상하 분할한다", async ({
  page,
}) => {
  await openEditor(page);
  await page.locator("textarea").fill("first");
  await addTabButton(page).click();
  await page.locator("textarea").fill("second");
  const body = page.locator(".body");
  const box = (await body.boundingBox())!;
  await page
    .locator(".tab-title")
    .filter({ hasText: "first" })
    .dragTo(body, {
      targetPosition: { x: box.width * 0.25, y: box.height * 0.75 },
    });
  await expect(page.locator(".pane-slot")).toHaveCount(2);
  await expect(page.locator('[data-pane="left-bottom"] textarea')).toHaveValue(
    "first",
  );
});
