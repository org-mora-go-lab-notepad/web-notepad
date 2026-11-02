import { expect, test } from "@playwright/test";

import { DESKTOP_VIEWPORT } from "../../__constant__";
import { openEditor } from "../../__util__";
import { expectCssPx, openSettingsPanel } from "../../__util__";
import { fontScaleRadio, settingsPanel } from "../__util__";

test("6. 선택한 폰트 비율을 탭·편집기·하단 메뉴·우측 패널에 즉시 적용한다", async ({
  page,
}) => {
  await page.setViewportSize(DESKTOP_VIEWPORT);
  await openEditor(page);
  await openSettingsPanel(page);

  const editor = page.locator("textarea").first();
  const tabTitle = page.locator(".tab-item.is-active .tab-title");
  const panelTitle = settingsPanel(page).getByRole("heading", {
    name: "Settings",
  });
  const footer = page.locator(".footer");
  await expectCssPx(editor, "fontSize", 15.1);
  await expectCssPx(tabTitle, "fontSize", 13.5);
  await expectCssPx(panelTitle, "fontSize", 19.8);
  await expectCssPx(footer, "fontSize", 12.6);

  await fontScaleRadio(page, "120%").check();
  await expect(fontScaleRadio(page, "120%")).toBeChecked();
  await expectCssPx(editor, "fontSize", 20.8);
  await expectCssPx(tabTitle, "fontSize", 18);
  await expectCssPx(panelTitle, "fontSize", 26.4);
  await expectCssPx(footer, "fontSize", 16.8);
});
