import { expect, test } from "@playwright/test";

import { openSettingsPanel } from "../../__util__";

test("5. Group Position은 Left와 Right를 제공하고 기본 Left이며 키보드로 선택한다", async ({
  page,
}) => {
  await page.goto("/");
  await openSettingsPanel(page);
  const panel = page.locator("#settings-panel");
  const group = panel.getByRole("radiogroup", {
    name: "Group Position",
    exact: true,
  });
  const left = group.getByRole("radio", { name: "Left", exact: true });
  const right = group.getByRole("radio", { name: "Right", exact: true });
  await expect(group.getByRole("radio")).toHaveCount(2);
  await expect(left).toBeChecked();
  await expect(right).not.toBeChecked();
  await left.focus();
  await page.keyboard.press("ArrowRight");
  await expect(right).toBeChecked();
  await expect(left).not.toBeChecked();
  await expect(page.locator(".home")).toHaveAttribute(
    "data-group-position",
    "right",
  );
  await expect(
    panel
      .getByRole("radiogroup", { name: "Panel Position", exact: true })
      .getByRole("radio", { name: "Right", exact: true }),
  ).toBeChecked();
});
