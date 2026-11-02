import { expect, test } from "@playwright/test";

import { tabColors } from "../../__constant__";
import { openEditor } from "../../__util__";
import { activeTabItem, lineButtons } from "../../__util__";

test("3. 클릭과 키보드로 선택한 줄 번호를 활성 탭 색상으로 강조한다", async ({
  page,
}) => {
  await openEditor(page);
  const editor = page.locator("textarea");
  await editor.fill("first\nsecond\nthird");
  const tab = activeTabItem(page);
  const colorButton = tab.locator(".dirty-dot");
  const lines = lineButtons(page);

  await expect(lines.first()).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(page.locator(".line-rail")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  await expect(page.locator(".workspace")).toHaveCSS(
    "background-color",
    "rgb(17, 17, 16)",
  );
  await lines.first().click();
  await expect(lines.first()).toHaveAttribute("aria-pressed", "true");
  await lines.first().click();
  await lines.nth(1).focus();
  await lines.nth(1).press("Enter");
  await expect(lines.nth(1)).toHaveAttribute("aria-pressed", "true");
  await expect(lines.nth(1)).toHaveCSS("background-color", tabColors[0].line);
  await expect(lines.nth(1)).toHaveCSS("color", tabColors[0].text);
  await expect(editor).toHaveCSS(
    "background-image",
    /rgba\(184, 184, 176, 0\.2\)/,
  );
  await lines.nth(1).press("Enter");
  await expect(lines.nth(1)).toHaveAttribute("aria-pressed", "false");

  for (const [index, color] of tabColors.entries()) {
    await expect(tab).toHaveAttribute("data-tab-color", color.name);
    await expect(lines.nth(1)).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
    await lines.first().click();
    await expect(lines.first()).toHaveCSS("background-color", color.line);
    await expect(lines.first()).toHaveCSS("color", color.text);
    await lines.first().click();
    await expect(lines.first()).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
    if (index < tabColors.length - 1) await colorButton.click();
  }
});
