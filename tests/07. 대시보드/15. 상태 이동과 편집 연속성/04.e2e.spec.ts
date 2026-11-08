import { expect, test } from "@playwright/test";

import {
  moveDashboardCard,
  readActiveGroup,
  seedStatusIntegrity,
} from "../../__util__";

test("4. 카드 상태 변경 후 편집과 새로고침에도 내용과 새 상태를 함께 보존한다", async ({
  page,
}) => {
  await seedStatusIntegrity(page);
  await moveDashboardCard(page, "in-progress");
  await page.locator("textarea").fill("Updated integrity\nnew body");
  await page.reload();
  await expect(page.locator("textarea")).toHaveValue(
    "Updated integrity\nnew body",
  );
  const group = await readActiveGroup(page);
  expect(group.tabs[0].tabColor).toBe("indigo");
  expect(group.bookmarks[0].content).toBe("Updated integrity\nnew body");
});
