import { expect, test } from "@playwright/test";

import { ensureEditorTab, writeStoredState } from "../../__util__";

test("6. 모바일 WebView의 긴 문서에서 편집기와 번호의 줄 간격과 스크롤을 맞춘다", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
    userAgent:
      "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36 Line/14.0",
  });
  try {
    const page = await context.newPage();
    await writeStoredState(page, { settings: { fontScale: 1.1 } });
    await ensureEditorTab(page);
    for (const width of [390, 320, 600]) {
      await page.setViewportSize({ width, height: 800 });
      const editor = page.locator("textarea").first();
      await editor.fill(
        Array.from({ length: 160 }, (_, i) => "line " + i).join("\n"),
      );
      const metrics = await editor.evaluate((el) => {
        const area = el as HTMLTextAreaElement,
          style = getComputedStyle(el);
        const rail = el.closest(".note-editor")!.querySelector(".line-rail")!;
        const rows = Array.from(rail.querySelectorAll("span"));
        return {
          pitch: parseFloat(style.lineHeight),
          first: rows[0].getBoundingClientRect().top,
          last: rows.at(-1)!.getBoundingClientRect().top,
          count: rows.length,
          nativeHeight:
            area.scrollHeight -
            parseFloat(style.paddingTop) -
            parseFloat(style.paddingBottom),
          adjust: getComputedStyle(
            el.closest(".note-editor")!,
          ).getPropertyValue("text-size-adjust"),
        };
      });
      expect(metrics.count).toBe(160);
      expect(Number.isInteger(metrics.pitch)).toBe(true);
      expect(metrics.last - metrics.first).toBeCloseTo(159 * metrics.pitch, 1);
      expect(metrics.nativeHeight).toBeCloseTo(160 * metrics.pitch, 0);
      expect(metrics.adjust).toBe("100%");
      for (const ratio of [0.25, 0.7, 1]) {
        await editor.evaluate((el, scrollRatio) => {
          const scroller = el.closest<HTMLElement>(".note-editor")!;
          scroller.scrollTop =
            (scroller.scrollHeight - scroller.clientHeight) * scrollRatio;
        }, ratio);
        await expect
          .poll(() =>
            editor.evaluate((el) => {
              const rail = el
                .closest(".note-editor")!
                .querySelector<HTMLElement>(".line-rail")!;
              const firstLine = rail.querySelector("span")!;
              const expectedTop =
                el.getBoundingClientRect().top +
                Number.parseFloat(getComputedStyle(el).paddingTop);
              return Math.abs(
                firstLine.getBoundingClientRect().top - expectedTop,
              );
            }),
          )
          .toBeLessThanOrEqual(0.5);
      }
    }
  } finally {
    await context.close();
  }
});
