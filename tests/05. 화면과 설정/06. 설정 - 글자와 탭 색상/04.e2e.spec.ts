import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";
import {
  activeTabItem,
  addTabButton,
  cycleActiveTabColor,
  openSettingsPanel,
} from "../../__util__";
import { closeSettingsPanel, tabColorRadio } from "../__util__";

test("4. 탭 색상 아이콘은 설정한 순서로 순환하고 새 탭은 1번째 색상으로 시작한다", async ({
  page,
}) => {
  await openEditor(page);
  const tab = activeTabItem(page);
  await expect(tab).toHaveAttribute("data-tab-color", "gray");

  await openSettingsPanel(page);
  await tabColorRadio(page, 1, "Pink").check();
  await tabColorRadio(page, 2, "Teal").check();
  await tabColorRadio(page, 3, "Indigo").check();
  await closeSettingsPanel(page);

  // Existing tabs keep their slot: the gray tab becomes the new first color.
  await expect(tab).toHaveAttribute("data-tab-color", "pink");
  await expect
    .poll(() =>
      tab
        .locator(".dirty-dot")
        .evaluate(
          (button) => getComputedStyle(button, "::before").backgroundColor,
        ),
    )
    .toBe("rgb(245, 163, 208)");

  await addTabButton(page).click();
  await expect(activeTabItem(page)).toHaveAttribute("data-tab-color", "pink");
  for (const color of ["teal", "indigo", "pink"]) {
    await cycleActiveTabColor(page);
    await expect(activeTabItem(page)).toHaveAttribute("data-tab-color", color);
  }
});
