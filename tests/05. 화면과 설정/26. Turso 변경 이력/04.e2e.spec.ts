import { expect, test } from "@playwright/test";

import { signedSession } from "../../__fixture__";
import { openEditor } from "../../__util__";
import { authenticateBrowser } from "../../__util__";
import { readCloudHistory } from "./__util__";

test("4. 저장 대기 중 새로고침해도 변경을 복구해 저장한다", async ({
  page,
  context,
}) => {
  await authenticateBrowser(
    context,
    signedSession({
      id: `cloud-reload-${crypto.randomUUID()}`,
      nickname: "Cloud User",
      expiresAt: Date.now() + 60_000,
    }),
  );
  await openEditor(page);
  await expect(page.locator("button.auth-command")).toContainText("Cloud User");
  await page.locator("textarea").first().fill("새로고침 전 글");
  await expect(page.locator(".home")).toHaveAttribute(
    "data-cloud-save",
    "pending",
  );
  await page.reload();
  await expect(page.locator(".home")).toHaveAttribute(
    "data-cloud-save",
    "saved",
    { timeout: 15_000 },
  );
  const history = await readCloudHistory(page);
  expect(history.count).toBe(1);
  expect(history.latest?.snapshot).toContain("새로고침 전 글");
});
