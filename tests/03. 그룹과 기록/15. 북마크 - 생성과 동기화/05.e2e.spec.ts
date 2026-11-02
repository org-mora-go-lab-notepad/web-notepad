import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";
import {
  bookmarkActiveTab,
  cycleActiveTabColor,
  readStoredState,
} from "../../__util__";

test("5. 원본 탭의 색상이 바뀌면 연결된 북마크의 탭 색상을 갱신한다", async ({
  page,
}) => {
  await openEditor(page);
  await bookmarkActiveTab(page, "bookmark color");
  await cycleActiveTabColor(page, 2);

  await expect
    .poll(
      async () => (await readStoredState(page)).groups[0].bookmarks[0].tabColor,
    )
    .toBe("indigo");
});
