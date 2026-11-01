import { expect, test } from "@playwright/test";

import { signedSession } from "../../__fixture__";
import { authenticateBrowser } from "../../__util__";
import { readCloudHistory } from "./__util__";

test("3. 저장 실패 뒤 대기 중인 변경을 자동 재시도한다", async ({
  page,
  context,
}) => {
  await authenticateBrowser(
    context,
    signedSession({
      id: `cloud-retry-${crypto.randomUUID()}`,
      nickname: "Cloud User",
      expiresAt: Date.now() + 60_000,
    }),
  );
  let attempts = 0;
  await page.route("**/api/notepad/history", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    attempts += 1;
    if (attempts === 1)
      return route.fulfill({ status: 503, body: "unavailable" });
    return route.continue();
  });
  await page.goto("/");
  await expect(page.locator("button.auth-command")).toContainText("Cloud User");
  await page.locator("textarea").first().fill("재시도할 글");
  await expect(page.locator(".home")).toHaveAttribute(
    "data-cloud-save",
    "error",
    { timeout: 15_000 },
  );
  await expect(page.locator(".home")).toHaveAttribute(
    "data-cloud-save",
    "saved",
    { timeout: 15_000 },
  );
  expect(attempts).toBe(2);
  expect((await readCloudHistory(page)).count).toBe(1);
});
