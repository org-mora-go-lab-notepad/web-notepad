import { expect } from "@playwright/test";

import { signedSession } from "../../__fixture__";
import { authenticateBrowser } from "../../__util__";
import { syncTest as test } from "./__fixture__";
import { openDevice, readHistory, waitForSaved } from "./__util__";

test("6. 같은 브라우저에서 다른 계정으로 바꾸면 이전 계정의 글을 전송하지 않는다", async ({
  devices: { desktop },
}) => {
  await openDevice(desktop);
  await desktop.locator("textarea").first().fill("첫 계정의 비공개 글");
  await waitForSaved(desktop);
  await authenticateBrowser(
    desktop.context(),
    signedSession({
      id: `other-${crypto.randomUUID()}`,
      nickname: "Sync User",
      expiresAt: Date.now() + 300_000,
    }),
  );
  await desktop.reload();
  await expect(desktop.locator("textarea")).toHaveCount(0);
  await desktop
    .getByRole("button", { name: "New tab", exact: true })
    .first()
    .click();
  await desktop.locator("textarea").first().fill("새 계정의 글");
  await waitForSaved(desktop);
  const history = await readHistory(desktop);
  expect(history.latest?.snapshot).toContain("새 계정의 글");
  expect(history.latest?.snapshot).not.toContain("첫 계정의 비공개 글");
});
