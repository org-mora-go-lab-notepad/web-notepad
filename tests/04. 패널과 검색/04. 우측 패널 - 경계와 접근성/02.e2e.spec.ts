import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";
import { openPanel } from "../../__util__";
import { dragPanelEdgeTo } from "../__util__";

test("2. 경계 음영은 카드 클릭과 패널 크기 조절을 막지 않는다", async ({
  page,
}) => {
  await openEditor(page);
  await page.locator("textarea").fill("Clickable dashboard card");
  await openPanel(page, "dashboard-panel");
  const panel = page.locator("#dashboard-panel");

  expect(
    await panel.evaluate(
      (element) => getComputedStyle(element, "::before").pointerEvents,
    ),
  ).toBe("none");
  await expect(panel.locator(".side-panel-resizer")).toHaveCSS(
    "pointer-events",
    "auto",
  );
  await panel
    .getByRole("button", { name: "Clickable dashboard card", exact: true })
    .click();
  await expect(panel).toHaveAttribute("aria-hidden", "false");
  const before = (await panel.boundingBox())!.width;
  await dragPanelEdgeTo(page, "dashboard-panel", 700);
  await expect
    .poll(async () => (await panel.boundingBox())!.width)
    .not.toBeCloseTo(before, 0);
});
