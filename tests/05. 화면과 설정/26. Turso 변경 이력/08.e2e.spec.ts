import { expect, test } from "@playwright/test";

import { signedSession } from "../../__fixture__";
import { authenticateBrowser } from "../../__util__";

test("8. 로그인 사용자의 첫 진입은 상단 진행 바를 표시하고 최신 DB 동기화가 끝날 때까지 입력을 차단한다", async ({
  page,
  context,
}) => {
  await authenticateBrowser(
    context,
    signedSession({
      id: `cloud-loader-${crypto.randomUUID()}`,
      nickname: "Cloud User",
      expiresAt: Date.now() + 60_000,
    }),
  );
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/notepad/history", async (route) => {
    if (route.request().method() === "GET") await gate;
    await route.continue();
  });
  await page.goto("/");
  const loader = page.getByRole("status", { name: "Syncing notes" });
  await expect(loader).toBeVisible();
  await expect(loader).toHaveAttribute("aria-busy", "true");
  await expect(page.locator(".loading-skeleton, .loading-mark")).toHaveCount(0);
  await expect(page.locator(".initial-sync-progress")).toBeVisible();

  const editor = page.locator("textarea").first();
  await expect(editor).toBeVisible();
  const loaderStyles = await loader.evaluate((element) => {
    const lock = getComputedStyle(element);
    const progress = getComputedStyle(
      element.querySelector(".initial-sync-progress")!,
    );
    return {
      lockPosition: lock.position,
      pointerEvents: lock.pointerEvents,
      touchAction: lock.touchAction,
      progressPosition: progress.position,
      progressTop: progress.top,
      progressOpacity: progress.opacity,
      progressColor: progress.backgroundImage,
    };
  });
  expect(loaderStyles).toMatchObject({
    lockPosition: "fixed",
    pointerEvents: "auto",
    touchAction: "none",
    progressPosition: "fixed",
    progressTop: "0px",
    progressOpacity: "0.8",
  });
  expect(loaderStyles.progressColor).not.toBe("none");

  const editorBounds = (await editor.boundingBox())!;
  await page.mouse.click(
    editorBounds.x + editorBounds.width / 2,
    editorBounds.y + editorBounds.height / 2,
  );
  await expect(editor).not.toBeFocused();

  release();
  await expect(loader).toHaveCount(0);
  await editor.click();
  await expect(editor).toBeFocused();
});
