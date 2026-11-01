import type { CDPSession, Locator, Page } from "@playwright/test";

const sessions = new WeakMap<Page, CDPSession>();

// Sends one complete touch gesture through Chromium's browser input pipeline.
// Assertions stay in each scenario; only the repeated physical input is shared.
export async function swipeTouch(target: Locator, direction: "left" | "right") {
  const page = target.page();
  let session = sessions.get(page);
  if (!session) {
    session = await page.context().newCDPSession(page);
    sessions.set(page, session);
  }
  await target.scrollIntoViewIfNeeded();
  const bounds = await target.boundingBox();
  if (!bounds) throw new Error("Swipe target must be visible");
  const y = bounds.y + bounds.height / 2;
  const from = direction === "left" ? 0.8 : 0.2;
  const to = 1 - from;
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: bounds.x + bounds.width * from, y }],
  });
  for (let step = 1; step <= 5; step++) {
    await page.waitForTimeout(20);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: bounds.x + bounds.width * (from + ((to - from) * step) / 5), y },
      ],
    });
  }
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
}
