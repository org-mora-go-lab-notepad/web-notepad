import { expect } from "@playwright/test";

import {
  createGroupsWithTabs,
  ensureEditorTab,
  readStoredState,
} from "../../__util__";
import { syncTest as test } from "./__fixture__";
import { openDevice, waitForSaved } from "./__util__";

test("1. PC에서 만든 그룹과 새 탭의 글을 같은 계정 모바일에서 새로고침해 복원한다", async ({
  devices: { desktop, mobile },
}) => {
  await openDevice(desktop);
  await createGroupsWithTabs(desktop, "Cross device group");
  await desktop.getByRole("button", { name: "New tab", exact: true }).click();
  await desktop.locator("textarea").first().fill("PC에서 작성한 글");
  await waitForSaved(desktop);
  await openDevice(mobile);
  await expect(mobile.locator("textarea:visible").first()).toHaveValue(
    "PC에서 작성한 글",
  );
  await mobile.reload();
  await ensureEditorTab(mobile);
  await expect(mobile.locator("textarea:visible").first()).toHaveValue(
    "PC에서 작성한 글",
  );
  const state = await readStoredState(mobile);
  const tabs = state.groups.find(
    (group) => group.name === "Cross device group",
  )?.tabs;
  expect(tabs).toHaveLength(2);
  expect(tabs?.map((tab) => tab.content).sort()).toEqual([
    "",
    "PC에서 작성한 글",
  ]);
});
