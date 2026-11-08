import { expect, test } from "@playwright/test";

import {
  moveDashboardCard,
  readActiveGroup,
  seedStatusIntegrity,
} from "../../__util__";

test("4. 북마크된 카드의 상태 색상은 원본 북마크에도 반영한다", async ({
  page,
}) => {
  await seedStatusIntegrity(page);
  await moveDashboardCard(page, "done");
  const group = await readActiveGroup(page);
  expect(group.tabs[0].tabColor).toBe("teal");
  expect(group.bookmarks[0]).toMatchObject({
    id: "b1",
    sourceTabId: "tab-1",
    tabColor: "teal",
    content: "Integrity task\nkept body",
    selectedLines: [1],
  });
});
