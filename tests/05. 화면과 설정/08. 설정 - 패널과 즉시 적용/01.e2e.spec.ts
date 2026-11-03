import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import { createGroupFixture, createTabFixture } from "../../__fixture__";
import {
  openPanel,
  openSettingsPanel,
  readStoredState,
  writeStoredState,
} from "../../__util__";

test("1. Panel Slide 설정을 제거하고 이전 On 저장값도 패널을 애니메이션 없이 표시한다", async ({
  page,
}) => {
  await writeStoredState(page, {
    activeGroupId: "ungrouped",
    settings: { panelSlide: true },
    groups: [
      createGroupFixture("ungrouped", "Ungrouped", [
        createTabFixture("preserved", "Keep this saved note"),
      ]),
    ],
  });
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await openSettingsPanel(page);
    await expect(
      page.getByRole("radiogroup", { name: "Panel Slide" }),
    ).toHaveCount(0);
    await expect(page.locator("#settings-panel")).toHaveCSS(
      "transition-duration",
      "0s",
    );
    await page.keyboard.press("Escape");
    await openPanel(page, "dashboard-panel");
    await expect(page.locator("#dashboard-panel")).toHaveCSS(
      "transition-duration",
      "0s",
    );
    await page.keyboard.press("Escape");
  }
  const state = await readStoredState(page);
  expect(state.settings).not.toHaveProperty("panelSlide");
  expect(state.groups[0].tabs[0]).toMatchObject({
    id: "preserved",
    content: "Keep this saved note",
  });
});
