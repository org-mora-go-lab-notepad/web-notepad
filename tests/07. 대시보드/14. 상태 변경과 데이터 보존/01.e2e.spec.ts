import { expect, test } from "@playwright/test";

import {
  moveDashboardCard,
  readActiveGroup,
  readStoredState,
  seedStatusIntegrity,
} from "../../__util__";

test("1. 상태 변경 뒤에도 노트 내용과 줄 선택 및 저장 기준을 보존한다", async ({
  page,
}) => {
  await seedStatusIntegrity(page);
  await moveDashboardCard(page, "in-progress");
  expect((await readActiveGroup(page)).tabs[0]).toMatchObject({
    id: "tab-1",
    content: "Integrity task\nkept body",
    savedContent: "Integrity task\nkept body",
    selectedLines: [1],
    bookmarked: true,
    open: true,
  });
  await page.reload();
  await expect(page.locator("textarea")).toHaveValue(
    "Integrity task\nkept body",
  );
  expect((await readStoredState(page)).groups[0].tabs[0].selectedLines).toEqual(
    [1],
  );
});
