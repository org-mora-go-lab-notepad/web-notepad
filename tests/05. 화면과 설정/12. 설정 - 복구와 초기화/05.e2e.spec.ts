import { expect, test } from "@playwright/test";

import { STORAGE_KEY } from "../../__constant__";
import { openSettingsPanel } from "../../__util__";
import {
  fontScaleRadio,
  languageRadio,
  settingsPanel,
  tabColorRadio,
} from "../__util__";

test("5. 설정 초기화로 되돌린 모든 기본값을 브라우저에 저장한다", async ({
  page,
}) => {
  await page.goto("/");
  await openSettingsPanel(page);
  const panel = settingsPanel(page);
  await fontScaleRadio(page, "120%").check();
  await tabColorRadio(page, 1, "Pink").check();
  await panel
    .getByRole("radiogroup", { name: "Group Position" })
    .getByRole("radio", { name: "Right", exact: true })
    .check();
  await panel
    .getByRole("radiogroup", { name: "Footer Icons Only" })
    .getByRole("radio", { name: "On", exact: true })
    .check();
  await panel
    .getByRole("radiogroup", { name: "Panel Position", exact: true })
    .getByRole("radio", { name: "Left", exact: true })
    .check();
  await languageRadio(page, "한국어").check();
  await panel.getByRole("button", { name: "설정 초기화", exact: true }).click();
  await page
    .getByRole("alertdialog", { name: "설정 초기화" })
    .getByRole("button", { name: "초기화", exact: true })
    .click();

  await expect(panel.locator("h2")).toHaveText("Settings");
  await expect(fontScaleRadio(page, "90%")).toBeChecked();
  await expect(tabColorRadio(page, 1, "Gray")).toBeChecked();
  await expect(tabColorRadio(page, 2, "Orange")).toBeChecked();
  await expect(tabColorRadio(page, 3, "Indigo")).toBeChecked();
  await expect(languageRadio(page, "English")).toBeChecked();
  await expect(
    panel
      .getByRole("radiogroup", { name: "Group Position" })
      .getByRole("radio", { name: "Left", exact: true }),
  ).toBeChecked();
  await expect(
    panel
      .getByRole("radiogroup", { name: "Footer Icons Only" })
      .getByRole("radio", { name: "Off", exact: true }),
  ).toBeChecked();
  await expect(
    panel
      .getByRole("radiogroup", { name: "Panel Position", exact: true })
      .getByRole("radio", { name: "Right", exact: true }),
  ).toBeChecked();

  await expect
    .poll(() =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!).state.settings,
        STORAGE_KEY,
      ),
    )
    .toEqual({
      fontScale: 0.9,
      tabColorCycleVersion: 2,
      dashboardStatusDefaults: {},
      tabColorCycle: ["gray", "orange", "indigo"],
      language: "en",
      groupPosition: "left",
      panelPosition: "right",
      footerItems: ["core:groups", "core:dashboard", "core:account"],
      footerIconsOnly: false,
    });
});
