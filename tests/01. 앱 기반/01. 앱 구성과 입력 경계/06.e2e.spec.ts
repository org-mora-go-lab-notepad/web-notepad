import { expect, test } from "@playwright/test";

import { MOBILE_VIEWPORT, STORAGE_KEY } from "../../__constant__";
import { openEditor } from "../../__util__";
import {
  chooseGroupAction,
  createGroup,
  groupsCommand,
  openGlobalSearchPanel,
} from "../../__util__";

test.use({ viewport: MOBILE_VIEWPORT, isMobile: true, hasTouch: true });

test("6. 터치 에디터도 기존 축소 크기에서 1px 늘리고 다른 입력란은 최소 16px를 유지한다", async ({
  page,
}) => {
  // At 80%, the former 16px editor floor is reduced by exactly 3px.
  await page.addInitScript((key) => {
    if (sessionStorage.getItem("touch-font-seed")) return;
    localStorage.setItem(
      key,
      JSON.stringify({ state: { settings: { fontScale: 0.8 } }, version: 0 }),
    );
    sessionStorage.setItem("touch-font-seed", "true");
  }, STORAGE_KEY);
  await openEditor(page);
  expect(
    await page.evaluate(() => matchMedia("(pointer: coarse)").matches),
  ).toBe(true);

  const fontSize = (selector: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
  expect(await fontSize(".note-area")).toBe(14);

  await openGlobalSearchPanel(page);
  expect(await fontSize("#global-search-popup input")).toBeGreaterThanOrEqual(
    16,
  );
  await page.keyboard.press("Escape");

  await groupsCommand(page).click();
  await createGroup(page, "Alpha");
  expect(await fontSize(".group-create-form input")).toBeGreaterThanOrEqual(16);
  await chooseGroupAction(page, "Alpha", "수정");
  await expect(
    page.getByRole("textbox", { name: "Edit Alpha group name" }),
  ).toBeVisible();
  expect(await fontSize(".group-edit-form input")).toBeGreaterThanOrEqual(16);
});
