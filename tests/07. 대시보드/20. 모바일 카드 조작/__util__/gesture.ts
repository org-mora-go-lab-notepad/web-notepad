import { expect, type Page } from "@playwright/test";
export async function flickSheet(
  page: Page,
  distance: number,
  duration: number,
) {
  const sheet = page.locator(".dashboard-preview");
  const grip = sheet.getByRole("slider");
  const height = Number(await grip.getAttribute("aria-valuenow"));
  await expect
    .poll(async () => (await sheet.boundingBox())!.height)
    .toBeCloseTo((page.viewportSize()!.height * height) / 100, 0);
  const box = (await grip.boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const session = await page.context().newCDPSession(page);
  const start = Date.now() / 1000;
  try {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
      timestamp: start,
    });
    for (let step = 1; step <= 4; step++) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: y + (distance * step) / 4 }],
        timestamp: start + (duration * step) / 4000,
      });
    }
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
      timestamp: start + duration / 1000 + 0.001,
    });
  } finally {
    await session.detach();
  }
}
