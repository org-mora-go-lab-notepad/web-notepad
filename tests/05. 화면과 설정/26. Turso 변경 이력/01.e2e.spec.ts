import { expect, test } from "@playwright/test";

import { signedSession } from "../../__fixture__";
import { openEditor } from "../../__util__";
import { authenticateBrowser, expectTabSavingLine } from "../../__util__";
import { readCloudHistory } from "./__util__";

test("1. 에디터 수정 후 0.25초 대기한 뒤 저장 중에만 탭 상단 선을 움직인다", async ({
  page,
  context,
}) => {
  await authenticateBrowser(
    context,
    signedSession({
      id: "half-second-" + crypto.randomUUID(),
      nickname: "Cloud User",
      expiresAt: Date.now() + 300_000,
    }),
  );
  const initial = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/notepad/history") &&
      response.request().method() === "GET",
  );
  await openEditor(page);
  await initial;
  await expect(page.locator("button.auth-command")).toBeVisible();
  await expect(page.locator(".home")).toHaveAttribute(
    "data-cloud-save",
    "saved",
  );
  const baselineCount = (await readCloudHistory(page)).count;
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-01-02T00:00:00Z"));
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let posts = 0;
  await page.route("**/api/notepad/history", async (route) => {
    if (route.request().method() === "POST") {
      posts += 1;
      await gate;
    }
    await route.continue();
  });
  const tab = page.locator(".tab-item.is-active");
  try {
    await page.locator("textarea").first().fill("마지막 글");
    await page.clock.runFor(249);
    expect(posts).toBe(0);
    await expectTabSavingLine(tab, false);
    await page.clock.runFor(1);
    await expect.poll(() => posts).toBe(1);
    await expectTabSavingLine(tab, true);
    await expect(tab.locator(".tab-title")).toHaveCSS("animation-name", "none");
    expect((await readCloudHistory(page)).count).toBe(baselineCount);
  } finally {
    release();
  }
  await expect(page.locator(".home")).toHaveAttribute(
    "data-cloud-save",
    "saved",
    { timeout: 15_000 },
  );
  await expectTabSavingLine(tab, false);
  expect((await readCloudHistory(page)).count).toBe(baselineCount + 1);
});
