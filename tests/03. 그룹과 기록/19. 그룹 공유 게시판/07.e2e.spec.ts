import { expect } from "@playwright/test";

import { boardTest as test } from "../../__fixture__";
import { openEditor } from "../../__util__";
import { createGroupsWithTabs, openBoard } from "../../__util__";

test("7. Board 목록은 My Group과 Shared Group을 함께 표시한다", async ({
  page,
  boardPost,
}) => {
  await openEditor(page);
  await createGroupsWithTabs(page, "Personal board group");
  await page.locator("textarea").first().fill("개인 그룹의 보드 노트");
  await openBoard(page);
  await expect(page.getByRole("heading", { name: "Board" })).toBeVisible();
  await expect(
    page.locator('.board-entry[data-group-id^="local-"]', {
      hasText: "Personal board group",
    }),
  ).toBeVisible();
  await expect(
    page.locator(`.board-entry[data-group-id="${boardPost.id}"]`),
  ).toBeVisible();
});
