import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";
import { addTabButton } from "../../__util__";
import { hoverTabOverPane, moveOverPane, paneSlot } from "../__util__";

test("2. Split right와 Split down을 동시에 표시할 때 우상단과 하단 영역을 나눠 쓴다", async ({
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
  await moveOverPane(page, left, 0.25, 0.75);
  const rightBox = (await left
    .locator(".note-pane-drop", { hasText: "Split right" })
    .boundingBox())!;
  const downBox = (await left
    .locator(".note-pane-drop", { hasText: "Split down" })
    .boundingBox())!;
  expect(rightBox.x).toBeCloseTo(bodyBox.x + bodyBox.width / 2, 0);
  expect(rightBox.y + rightBox.height).toBeCloseTo(
    bodyBox.y + bodyBox.height / 2,
    0,
  );
  expect(downBox.y).toBeCloseTo(bodyBox.y + bodyBox.height / 2, 0);
  expect(downBox.width).toBeCloseTo(bodyBox.width, 0);
  await release();
});
