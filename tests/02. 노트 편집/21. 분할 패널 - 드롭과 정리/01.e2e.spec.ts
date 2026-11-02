import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";
import { addTabButton } from "../../__util__";
import { hoverTabOverPane, paneSlot } from "../__util__";

test("1. 우측 편집기가 비어 있으면 Split right를 패널 오른쪽 절반에 표시한다", async ({
  page,
}) => {
  await openEditor(page);
  await page.locator("textarea").fill("a");
  for (const content of ["b", "c"]) {
    await addTabButton(page).click();
    await page.locator("textarea").fill(content);
  }
  const left = paneSlot(page, "left");
  const bodyBox = (await left.locator(".body").boundingBox())!;
  const tab = page.locator(".tab-item").filter({ hasText: /^c$/ });
  const release = await hoverTabOverPane(page, tab, left, 0.25, 0.4);
  const zone = left.locator(".note-pane-drop", { hasText: "Split right" });
  await expect(zone).toBeVisible();
  const box = (await zone.boundingBox())!;
  expect(box.x).toBeCloseTo(bodyBox.x + bodyBox.width / 2, 0);
  expect(box.x + box.width).toBeCloseTo(bodyBox.x + bodyBox.width, 0);
  expect(box.height).toBeCloseTo(bodyBox.height, 0);
  await release();
});
