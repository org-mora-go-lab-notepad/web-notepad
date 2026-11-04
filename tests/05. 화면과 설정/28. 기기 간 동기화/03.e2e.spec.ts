import { expect } from "@playwright/test";

import { syncTest as test } from "./__fixture__";
import { openDevice, readHistory, waitForSaved } from "./__util__";

test("3. 새 기기의 빈 초기 상태가 서버의 기존 글을 덮어쓰지 않는다", async ({
  devices: { desktop, mobile },
}) => {
  await openDevice(desktop);
  await desktop
    .locator("textarea")
    .first()
    .fill("빈 상태로 덮어쓰면 안 되는 글");
  await waitForSaved(desktop);
  const before = await readHistory(desktop);
  await openDevice(mobile);
  await waitForSaved(mobile);
  await expect(mobile.locator("textarea:visible").first()).toHaveValue(
    "빈 상태로 덮어쓰면 안 되는 글",
  );
  await mobile.evaluate(() => window.dispatchEvent(new Event("focus")));
  expect(await readHistory(mobile)).toEqual(before);
});
