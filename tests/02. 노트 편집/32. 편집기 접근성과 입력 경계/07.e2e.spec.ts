import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";

test.use({ hasTouch: true });

test("7. 모바일에서 라인 번호를 눌러도 편집기와 키보드 포커스를 열지 않는다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await openEditor(page);
  const editor = page.locator("textarea:visible").first();
  await editor.fill("첫 줄\n둘째 줄");
  await editor.evaluate((element) => element.blur());
  await page.locator(".line-rail:visible [role=button]").first().tap();
  await expect(
    page.locator(".line-rail:visible [role=button]").first(),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    await editor.evaluate((element) => document.activeElement === element),
  ).toBe(false);
});
