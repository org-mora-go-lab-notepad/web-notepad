import { expect, test } from "@playwright/test";

test("9. PC 메뉴와 대시보드는 푸터 위에서 열리고 전체 확장만 화면을 덮는다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 844 });
  await page.goto("/");
  const footer = page.locator(".footer");
  const footerBox = (await footer.boundingBox())!;
  expect(footerBox.y + footerBox.height).toBeCloseTo(844, 0);
  await expect(page.locator(".footer-dock")).toHaveCSS("gap", "25px");

  await page.locator(".group-select-command").click();
  const groupBox = (await page.locator("#groups-menu").boundingBox())!;
  expect(groupBox.y + groupBox.height).toBeCloseTo(footerBox.y, 0);
  await page.locator(".group-select-command").click();

  await page.locator(".dashboard-command").click();
  const dashboard = page.locator("#dashboard-panel");
  const dashboardBox = (await dashboard.boundingBox())!;
  expect(dashboardBox.y + dashboardBox.height).toBeCloseTo(footerBox.y, 0);

  await page.getByRole("button", { name: "Expand card" }).click();
  await expect(page.locator(".side-panel.dashboard")).toHaveClass(
    /is-expanded/,
  );
  const expandedBox = (await dashboard.boundingBox())!;
  expect(expandedBox.y).toBe(0);
  expect(expandedBox.height).toBeCloseTo(844, 0);
  const dashboardLayer = Number(
    await dashboard.evaluate((element) => getComputedStyle(element).zIndex),
  );
  const footerLayer = Number(
    await footer.evaluate((element) => getComputedStyle(element).zIndex),
  );
  expect(dashboardLayer).toBeGreaterThan(footerLayer);
});
