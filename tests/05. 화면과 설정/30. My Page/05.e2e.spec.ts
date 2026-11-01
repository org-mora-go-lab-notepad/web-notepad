import { expect, test } from "@playwright/test";

import { signedSession } from "../../__fixture__";
import { authenticateBrowser } from "../../__util__";
test("5. 좁은 모바일에서 긴 프로필 이름과 통계를 화면 안에 배치한다", async ({
  page,
  context,
}) => {
  await authenticateBrowser(
    context,
    signedSession({
      id: "my-mobile-" + crypto.randomUUID(),
      nickname: "A very long profile name for mobile layout ".repeat(4),
      profileImageUrl: "/test-user.svg",
      expiresAt: Date.now() + 300000,
    }),
  );
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/my-page");
  await expect(page.locator(".my-page-metrics")).toBeVisible();
  const header = page.locator(".fixed-page-header");
  const back = header.getByRole("link", { name: "Back" });
  const title = header.getByRole("heading", { name: "My Page" });
  const headerBounds = (await header.boundingBox())!;
  const backBounds = (await back.boundingBox())!;
  const titleBounds = (await title.boundingBox())!;
  const containerBounds = (await page
    .locator(".my-page-container")
    .boundingBox())!;
  expect(titleBounds.x + titleBounds.width).toBeCloseTo(
    containerBounds.x + containerBounds.width,
    1,
  );
  expect(await back.locator("svg").evaluate((icon) => icon.clientWidth)).toBe(
    18,
  );
  const portrait = (await page.locator(".my-page-portrait").boundingBox())!;
  const image = (await page.locator(".my-page-portrait img").boundingBox())!;
  await expect(page.locator(".my-page-portrait img")).toHaveCSS(
    "border-radius",
    "10px",
  );
  expect(image.width).toBeCloseTo(portrait.width - 2, 0);
  expect(image.x + image.width / 2).toBeCloseTo(
    portrait.x + portrait.width / 2,
    0,
  );
  expect(image.y + image.height / 2).toBeCloseTo(
    portrait.y + portrait.height / 2,
    0,
  );
  expect(
    (await page.locator(".my-page-metrics").boundingBox())!.y,
  ).toBeGreaterThan(portrait.y + portrait.height);
  const profile = (await page.locator(".my-page-profile").boundingBox())!;
  expect(profile.y + profile.height).toBeLessThanOrEqual(portrait.y);
  await expect(page.locator(".my-page")).toHaveCSS("scrollbar-width", "none");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= innerHeight,
    ),
  ).toBe(true);
  const main = page.locator(".my-page");
  await main.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  expect(await main.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  expect((await header.boundingBox())!.y).toBeCloseTo(headerBounds.y, 1);
  expect((await back.boundingBox())!.y).toBeCloseTo(backBounds.y, 1);
  const mobileFooter = page.locator(".my-page-mobile-footer .footer");
  await expect(mobileFooter).toBeVisible();
  const mobileFooterBounds = (await mobileFooter.boundingBox())!;
  expect(mobileFooterBounds.y + mobileFooterBounds.height).toBeCloseTo(568, 1);
  await mobileFooter.locator(".dashboard-command").click();
  await expect(page).toHaveURL(/[?&]panel=dashboard(?:&|$)/);
  await expect(page.locator("#dashboard-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
});
