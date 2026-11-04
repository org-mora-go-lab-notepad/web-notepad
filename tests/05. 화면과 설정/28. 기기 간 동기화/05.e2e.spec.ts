import { expect } from "@playwright/test";

import { readStoredState } from "../../__util__";
import { syncTest as test } from "./__fixture__";
import { openDevice, waitForSaved } from "./__util__";

test("5. 같은 글의 동시 수정이 충돌해도 Recovered 중복 탭을 만들지 않는다", async ({
  devices: { desktop, mobile },
}) => {
  await openDevice(desktop);
  await desktop.locator("textarea").first().fill("공통 원본");
  await waitForSaved(desktop);
  await openDevice(mobile);
  await waitForSaved(mobile);
  await mobile.route("**/api/notepad/history", (route) => route.abort());
  await mobile
    .locator("textarea:visible")
    .first()
    .fill("모바일에서 수정한 본문");
  await desktop.locator("textarea").first().fill("PC에서 수정한 본문");
  await waitForSaved(desktop);
  await mobile.unroute("**/api/notepad/history");
  await mobile.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect
    .poll(async () =>
      (await readStoredState(mobile)).groups.flatMap((group) =>
        group.tabs.map((tab) => tab.content),
      ),
    )
    .toContain("모바일에서 수정한 본문");
  const tabs = (await readStoredState(mobile)).groups.flatMap(
    (group) => group.tabs,
  );
  expect(tabs.some((tab) => tab.title.includes("(Recovered)"))).toBe(false);
  expect(
    tabs.filter((tab) => tab.content === "모바일에서 수정한 본문"),
  ).toHaveLength(1);
  await waitForSaved(mobile);
});
