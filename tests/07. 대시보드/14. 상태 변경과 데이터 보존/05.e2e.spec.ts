import { expect, test } from "@playwright/test";

import { createBookmarkFixture } from "../../__fixture__";
import {
  moveDashboardCard,
  readActiveGroup,
  seedStatusIntegrity,
} from "../../__util__";

test("5. 하나의 카드 상태를 옮겨도 같은 그룹의 다른 북마크는 변경하지 않는다", async ({
  page,
}) => {
  const sibling = createBookmarkFixture("b2", "tab-2", "Sibling snapshot", {
    tabColor: "pink",
    selectedLines: [0],
  });
  await seedStatusIntegrity(
    page,
    {},
    {
      bookmarks: [
        createBookmarkFixture("b1", "tab-1", "Integrity task\nkept body"),
        sibling,
      ],
    },
  );
  await moveDashboardCard(page, "in-progress");
  expect(
    (await readActiveGroup(page)).bookmarks.find(
      (bookmark) => bookmark.id === "b2",
    ),
  ).toEqual(sibling);
});
