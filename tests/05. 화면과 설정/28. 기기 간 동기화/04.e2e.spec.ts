import { expect } from "@playwright/test";

import { createGroupsWithTabs, readStoredState } from "../../__util__";
import { syncTest as test } from "./__fixture__";
import { openDevice, readHistory, waitForSaved } from "./__util__";

test("4. 저장 실패 후 새로고침하면 로컬 그룹과 다른 기기의 변경을 함께 보존한다", async ({
  devices: { desktop, mobile },
}) => {
  // This recovery flow includes multiple 3s save delays and a failed-save retry.
  test.setTimeout(60_000);
  await openDevice(desktop);
  await desktop.locator("textarea").first().fill("공통 원본");
  await waitForSaved(desktop);
  await openDevice(mobile);
  await waitForSaved(mobile);
  await mobile.route("**/api/notepad/history", (route) =>
    route.request().method() === "POST" ? route.abort() : route.continue(),
  );
  await createGroupsWithTabs(mobile, "Offline draft group");
  await mobile.locator("textarea").first().fill("모바일 미전송 글");
  await expect(mobile.locator(".home")).toHaveAttribute(
    "data-cloud-save",
    "error",
    { timeout: 15_000 },
  );
  await desktop.locator("textarea").first().fill("다른 PC의 최신 글");
  await waitForSaved(desktop);
  await mobile.reload();
  await expect
    .poll(async () => JSON.stringify(await readStoredState(mobile)))
    .toContain("다른 PC의 최신 글");
  expect(JSON.stringify(await readStoredState(mobile))).toContain(
    "모바일 미전송 글",
  );
  await mobile.unroute("**/api/notepad/history");
  await waitForSaved(mobile);
  const history = await readHistory(mobile);
  expect(history.latest?.snapshot).toContain("다른 PC의 최신 글");
  expect(history.latest?.snapshot).toContain("모바일 미전송 글");
});
