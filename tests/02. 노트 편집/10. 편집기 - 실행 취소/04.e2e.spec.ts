import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";
import { addTabButton } from "../../__util__";
import { dragTabToZone, paneSlot } from "../__util__";

test("4. 탭을 분할 패널 사이로 이동해도 실행 취소와 다시 실행 기록을 유지한다", async ({
  page,
}) => {
  await openEditor(page);
  const editor = page.locator("textarea");
  await editor.fill("left note");
  await addTabButton(page).click();
  await editor.fill("moving note");
  await editor.fill("moving note updated");

  await dragTabToZone(
    page,
    page.getByRole("tab", { selected: true }).locator(".tab-title"),
    paneSlot(page, "left"),
    "Split right",
  );
  const rightEditor = page.locator('[data-pane="right"] textarea');
  await expect(rightEditor).toHaveValue("moving note updated");

  await rightEditor.press("Meta+z");
  await expect(rightEditor).toHaveValue("moving note");
  await rightEditor.press("Meta+Shift+z");
  await expect(rightEditor).toHaveValue("moving note updated");
});
