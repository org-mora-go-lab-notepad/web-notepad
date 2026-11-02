import { expect, test } from "@playwright/test";

import { createGroupFixture, createTabFixture } from "../../__fixture__";
import { readStoredState, seedStoredStateOnLoad } from "../../__util__";

test("4. 저장된 임의 필드와 스토어 액션 이름 필드를 복원 상태에서 제외한다", async ({
  page,
}) => {
  await seedStoredStateOnLoad(page, {
    activeGroupId: "ungrouped",
    groups: [
      createGroupFixture("ungrouped", "Ungrouped", [
        createTabFixture("tab-1", "Protected note"),
      ]),
    ],
    nextTabNumber: 2,
    updateTab: "corrupted update action",
    addTab: null,
    createGroupWithTab: { corrupted: true },
    arbitraryField: "must not enter the store",
  });

  await expect
    .poll(async () => {
      const stored = (await readStoredState(page)) as unknown as Record<
        string,
        unknown
      >;
      return [
        "updateTab",
        "addTab",
        "createGroupWithTab",
        "arbitraryField",
      ].filter((key) => Object.hasOwn(stored, key));
    })
    .toEqual([]);
});
