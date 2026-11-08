import { expect, test } from "@playwright/test";

import { openSettingsPanel } from "../../__util__";
import { settingsPanel, tabColorRadio } from "../__util__";

const COLOR_LABELS = [
  "Gray",
  "Red",
  "Orange",
  "Yellow",
  "Green",
  "Teal",
  "Indigo",
  "Purple",
  "Pink",
];

test("3. Tab Colors의 세 순서에서 9가지 색상을 선택하며 기본값은 Gray → Orange → Indigo이다", async ({
  page,
}) => {
  await page.goto("/");
  await openSettingsPanel(page);
  const panel = settingsPanel(page);

  await expect(panel.locator(".setting-color-status")).toHaveText([
    "Waiting",
    "In Progress",
    "Done",
  ]);
  for (const order of [1, 2, 3]) {
    const radios = panel
      .getByRole("radiogroup", { name: `Tab color ${order}` })
      .getByRole("radio");
    await expect(radios).toHaveCount(9);
    expect(
      await radios.evaluateAll((items) =>
        items.map((item) => item.getAttribute("aria-label")),
      ),
    ).toEqual(COLOR_LABELS);
  }
  await expect(tabColorRadio(page, 1, "Gray")).toBeChecked();
  await expect(tabColorRadio(page, 2, "Orange")).toBeChecked();
  await expect(tabColorRadio(page, 3, "Indigo")).toBeChecked();
});
