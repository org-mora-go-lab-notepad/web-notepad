import { expect, test } from "@playwright/test";

import { signedSession } from "../../__fixture__";
import { authenticateBrowser } from "../../__util__";
test("5. 움직임 줄이기 환경에서는 저장 중 상단 선의 애니메이션을 정지한다", async ({
  page,
  context,
}) => {
  await authenticateBrowser(
    context,
    signedSession({
      id: "reduced-" + crypto.randomUUID(),
      nickname: "Cloud User",
      expiresAt: Date.now() + 300000,
    }),
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("button.auth-command")).toBeVisible();
  let release!: () => void;
  const gate = new Promise<void>((r) => {
    release = r;
  });
  await page.route("**/api/notepad/history", async (route) => {
    if (route.request().method() === "POST") await gate;
    await route.continue();
  });
  try {
    await page.locator("textarea").first().fill("Reduced motion save");
    await expect(page.locator(".home")).toHaveAttribute(
      "data-cloud-save",
      "saving",
    );
    const tab = page.locator(".tab-item.is-active");
    expect(
      await tab.evaluate((el) => getComputedStyle(el, "::after").animationName),
    ).toBe("none");
    await expect(tab.locator(".tab-title")).toHaveCSS(
      "background-image",
      "none",
    );
  } finally {
    release();
  }
});
