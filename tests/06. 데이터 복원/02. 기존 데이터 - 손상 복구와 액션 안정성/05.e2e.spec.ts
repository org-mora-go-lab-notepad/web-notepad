import { expect, test } from "@playwright/test";

import { createGroupFixture, createTabFixture } from "../../__fixture__";
import { seedStoredStateOnLoad } from "../../__util__";

test("5. 손상된 액션 이름 필드를 제거한 뒤 노트 편집이 동작한다", async ({
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
  });

  const editor = page.locator("textarea");
  await editor.fill("Protected note edited");
  await expect(editor).toHaveValue("Protected note edited");
});
