import { expect, test } from "@playwright/test";

import { openPanel, openSettingsPanel } from "../../__util__";

test("4. 모바일 패널은 푸터 위에서 끝나고 닫기 이후 카드 화면을 유지한다", async ({
  page,
}) => {
  await page.goto("/");
  await page.setViewportSize({ width: 360, height: 800 });
  const command = page.locator(".dashboard-command");
  const panel = page.locator("#dashboard-panel");
  await command.click();
  const footerTop = (await page.locator(".footer").boundingBox())!.y;
  const expectAboveFooter = async (locator: typeof panel) => {
    const bounds = (await locator.boundingBox())!;
    expect(bounds.y + bounds.height).toBeCloseTo(footerTop, 1);
  };
  await expectAboveFooter(panel);
  await page.locator("#dashboard-panel .side-panel-close").click();
  await expect(panel).toHaveAttribute("aria-hidden", "false");
  await expect(command).toHaveAttribute("aria-expanded", "true");
  await expect(command).toHaveClass(/is-active/);

  await page.locator(".group-select-command").click();
  await expectAboveFooter(page.locator(".group-menu"));
  await page.locator(".group-sidebar-header > button").click();

  await openSettingsPanel(page);
  await expectAboveFooter(page.locator("#settings-panel"));
  await page.locator("#settings-panel .side-panel-close").click();
  await openPanel(page, "dashboard-panel");
  await expectAboveFooter(panel);
});
