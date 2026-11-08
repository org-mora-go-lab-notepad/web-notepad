import { expect, test } from "@playwright/test";

import { authenticateBrowser, groupsCommand } from "../../__util__";

test("6. My Group과 Shared Group은 생성·전체 그룹 사이를 절반씩 차지하고 중복 경계선을 없앤다", async ({
  page,
}) => {
  await authenticateBrowser(page.context());
  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    if ((await groupsCommand(page).getAttribute("aria-expanded")) !== "true")
      await groupsCommand(page).click();
    const my = page.locator(".group-category").first(),
      shared = page.locator(".group-category").last();
    const fontScale = await page.evaluate(() =>
      Number(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--font-scale",
        ),
      ),
    );
    for (const button of [
      my.getByRole("button", { name: "My Group", exact: true }),
      shared.getByRole("button", { name: "Shared Group", exact: true }),
    ]) {
      await expect(button).toHaveCSS("font-size", `${14 * fontScale}px`);
    }
    const a = (await my.boundingBox())!,
      b = (await shared.boundingBox())!;
    expect(a.height).toBeCloseTo(b.height, 0);
    expect(a.y + a.height).toBeCloseTo(b.y, 0);
    const header = (await page.locator(".group-sidebar-header").boundingBox())!,
      system = (await page.locator(".group-more").boundingBox())!;
    expect(a.y).toBeGreaterThanOrEqual(header.y + header.height);
    const padding = await page
      .locator(".group-list")
      .evaluate((el) => parseFloat(getComputedStyle(el).paddingBottom));
    expect(b.y + b.height + padding).toBeCloseTo(system.y, 0);
    await expect(
      my.getByRole("button", { name: "My Group", exact: true }),
    ).toHaveCSS("border-top-width", "0px");
    await expect(
      shared.getByRole("button", { name: "Shared Group", exact: true }),
    ).toHaveCSS("border-top-width", "1px");
    if (width > 512) {
      for (const button of [
        my.getByRole("button", { name: "My Group", exact: true }),
        shared.getByRole("button", { name: "Shared Group", exact: true }),
      ]) {
        await button.hover();
        const hoverArea = await button.evaluate((element) => {
          const style = getComputedStyle(element, "::before");
          const bounds = element.getBoundingClientRect();
          return {
            horizontalReduction:
              ((parseFloat(style.left) + parseFloat(style.right)) /
                bounds.width) *
              100,
            verticalReduction:
              ((parseFloat(style.top) + parseFloat(style.bottom)) /
                bounds.height) *
              100,
          };
        });
        expect(hoverArea.horizontalReduction).toBeCloseTo(0, 0);
        expect(hoverArea.verticalReduction).toBeCloseTo(10, 0);
      }
      const separator = page.getByRole("separator", {
        name: "Resize group sections",
      });
      await expect(separator).toHaveAttribute("aria-valuenow", "50");
      const separatorBox = (await separator.boundingBox())!;
      await page.mouse.move(
        separatorBox.x + separatorBox.width / 2,
        separatorBox.y + separatorBox.height / 2,
      );
      await page.mouse.down();
      await page.mouse.move(
        separatorBox.x + separatorBox.width / 2,
        separatorBox.y + separatorBox.height / 2 + 60,
      );
      await page.mouse.up();
      const resized = Number(await separator.getAttribute("aria-valuenow"));
      expect(resized).toBeGreaterThan(50);
      await separator.focus();
      await separator.press("ArrowUp");
      await expect(separator).toHaveAttribute(
        "aria-valuenow",
        String(resized - 5),
      );
      await page.reload();
      await expect(
        page.getByRole("separator", { name: "Resize group sections" }),
      ).toHaveAttribute("aria-valuenow", String(resized - 5));
      await page.evaluate(() =>
        localStorage.removeItem("web-notepad-group-split"),
      );
    }
  }
});
