import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";
import { addTabButton } from "../../__util__";
import { dragTabToZone, paneSlot } from "../__util__";

test("1. 좌우 열의 상단 패널을 Split down으로 상하 분할해 최대 4분할까지 확장한다", async ({
  page,
}) => {
  await openEditor(page);
  await page.locator("textarea").fill("a");
  for (const content of ["b", "c", "d"]) {
    await addTabButton(page).click();
    await page.locator("textarea").fill(content);
  }
  const tab = (text: string) =>
    page.locator(".tab-item").filter({ hasText: new RegExp(`^${text}$`) });

  await dragTabToZone(page, tab("d"), paneSlot(page, "left"), "Split down");
  await expect(page.locator(".pane-slot")).toHaveCount(2);
  await expect(paneSlot(page, "left-bottom").locator("textarea")).toHaveValue(
    "d",
  );

  await dragTabToZone(page, tab("c"), paneSlot(page, "left"), "Split right");
  await expect(paneSlot(page, "right").locator("textarea")).toHaveValue("c");

  await dragTabToZone(page, tab("b"), paneSlot(page, "right"), "Split down");
  await expect(page.locator(".pane-slot")).toHaveCount(4);
  await expect(paneSlot(page, "left").locator("textarea")).toHaveValue("a");
  await expect(paneSlot(page, "right-bottom").locator("textarea")).toHaveValue(
    "b",
  );

  const [leftTop, leftBottom, rightTop, rightBottom] = await Promise.all(
    ["left", "left-bottom", "right", "right-bottom"].map(
      async (pane) => (await paneSlot(page, pane).boundingBox())!,
    ),
  );
  expect(leftBottom.y).toBeGreaterThanOrEqual(leftTop.y + leftTop.height);
  expect(rightBottom.y).toBeGreaterThanOrEqual(rightTop.y + rightTop.height);
  expect(rightTop.x).toBeGreaterThanOrEqual(leftTop.x + leftTop.width);
  expect(leftBottom.x).toBeCloseTo(leftTop.x, 0);
  expect(rightBottom.x).toBeCloseTo(rightTop.x, 0);
});
