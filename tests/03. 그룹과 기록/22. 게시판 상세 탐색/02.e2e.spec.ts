import { expect } from "@playwright/test";

import { boardTest as test } from "../../__fixture__";
import { openEditor } from "../../__util__";
import { openBoard, selectBoardPost, swipeTouch } from "../../__util__";

test.use({ hasTouch: true });

test("2. 공유 그룹 보드 상세의 글자를 2px 키운다", async ({
  page,
  boardPost,
}) => {
  await openEditor(page);
  await openBoard(page);
  await selectBoardPost(page, boardPost.title);
  const fontScale = await page.evaluate(() =>
    Number(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--font-scale",
      ),
    ),
  );

  for (const [selector, size] of [
    [".board-back", 16],
    [".board-owner", 17],
    [".board-meta", 15],
    [".board-join-hint", 14],
    [".board-detail-actions .board-primary", 15],
    [".board-detail-actions .board-copy", 15],
  ] as const) {
    const actual = await page
      .locator(selector)
      .first()
      .evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
    expect(actual).toBeCloseTo(size * fontScale, 1);
  }
  await expect(page.locator(".board-detail-hero")).toBeVisible();
  await expect(page.locator(".board-detail-summary")).toHaveCount(0);
  await expect(page.locator(".board-detail h3")).toHaveCount(0);
  await expect(page.locator(".board-group-name")).toHaveCount(0);
  await expect(page.locator(".board-description")).toHaveCount(0);
  const sharedNotesBounds = (await page
    .locator(".board-note-contents")
    .boundingBox())!;
  const heroBounds = (await page.locator(".board-detail-hero").boundingBox())!;
  const collaborationBounds = (await page
    .locator(".board-collaboration")
    .boundingBox())!;
  expect(sharedNotesBounds.y).toBeLessThan(heroBounds.y);
  expect(heroBounds.y - (sharedNotesBounds.y + sharedNotesBounds.height)).toBe(
    36,
  );
  expect(collaborationBounds.y - (heroBounds.y + heroBounds.height)).toBe(36);
  const noteLayout = await page
    .locator(".board-note-preview")
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        height: Number.parseFloat(style.height),
        minHeight: Number.parseFloat(style.minHeight),
        maxHeight: style.maxHeight,
        overflowY: style.overflowY,
        resize: style.resize,
      };
    });
  expect(noteLayout.height).toBeCloseTo(316.8 * 1.5, 0);
  expect(noteLayout.minHeight).toBeCloseTo(noteLayout.height, 0);
  expect(noteLayout.maxHeight).toBe("none");
  expect(noteLayout.overflowY).toBe("auto");
  expect(noteLayout.resize).toBe("none");
  const noteText = await page
    .locator(".board-note-preview pre")
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        color: style.color,
        fontSize: Number.parseFloat(style.fontSize),
        lineHeight: Number.parseFloat(style.lineHeight),
      };
    });
  expect(noteText.fontSize).toBeCloseTo(15 * fontScale, 1);
  expect(noteText.lineHeight / noteText.fontSize).toBeCloseTo(1.9, 1);
  expect(noteText.color).not.toBe("rgba(0, 0, 0, 0)");
  const gutter = await page
    .locator(".board-note-preview pre")
    .evaluate((element) => {
      const line = getComputedStyle(element, "::before");
      return {
        height: Number.parseFloat(line.height),
        preHeight: element.getBoundingClientRect().height,
      };
    });
  expect(gutter.height).toBeCloseTo(gutter.preHeight, 0);
  await expect(page.locator(".board-note-tabs")).toHaveCSS(
    "overflow-y",
    "hidden",
  );
  await expect(page.locator(".board-note-tabs")).toHaveCSS(
    "scrollbar-width",
    "none",
  );
  await expect(page.locator(".board-note-preview")).toHaveCSS("resize", "none");
  await expect(page.locator(".board-note-contents > h4")).toHaveCount(0);
  const sharedNotesSection = (await page
    .locator(".board-note-contents")
    .boundingBox())!;
  const firstSharedNoteTab = (await page
    .locator(".board-note-tabs > button")
    .first()
    .boundingBox())!;
  expect(firstSharedNoteTab.x).toBeCloseTo(sharedNotesSection.x, 0);
  await expect(page.locator(".board-note-contents")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  const preview = page.locator(".board-note-preview");
  const initialPreviewHeight = (await preview.boundingBox())!.height;
  await expect(page.getByTestId("board-note-resizer")).toHaveCount(0);
  expect((await preview.boundingBox())!.height).toBeCloseTo(
    initialPreviewHeight,
    0,
  );
  await expect(page.locator(".board-intro")).toHaveCount(0);
  await expect(page.locator(".board-detail-section")).toHaveCount(2);
  await expect(page.locator(".board-detail-hero.board-overview")).toHaveCount(
    1,
  );
  const desktopOverview = (await page
    .locator(".board-overview")
    .boundingBox())!;
  expect(desktopOverview.x).toBeCloseTo(sharedNotesBounds.x, 0);
  expect(desktopOverview.width).toBeCloseTo(sharedNotesBounds.width, 0);
  const desktopNotesMetric = (await page
    .locator(".board-meta > span")
    .nth(0)
    .boundingBox())!;
  const desktopBookmarksMetric = (await page
    .locator(".board-meta > span")
    .nth(2)
    .boundingBox())!;
  await expect(
    page.locator(".board-meta > span").nth(2).locator("small"),
  ).toHaveText("Bookmarks");
  await expect(
    page.locator(".board-meta > span").nth(2).locator("strong"),
  ).toHaveText("1");
  expect(desktopBookmarksMetric.width).toBeCloseTo(desktopNotesMetric.width, 0);
  await page.setViewportSize({ width: 320, height: 800 });
  await expect
    .poll(async () => {
      const editor = (await page.locator(".board-note-preview").boundingBox())!;
      const footer = (await page
        .locator(".board-mobile-footer")
        .boundingBox())!;
      return footer.y - (editor.y + editor.height);
    })
    .toBeCloseTo(20, 0);
  const mobileEditor = (await page
    .locator(".board-note-preview")
    .boundingBox())!;
  const mobileOverview = (await page.locator(".board-overview").boundingBox())!;
  expect(mobileEditor.x).toBeCloseTo(mobileOverview.x, 0);
  expect(mobileEditor.width).toBeCloseTo(mobileOverview.width, 0);
  const noteTabs = page.locator(".board-note-tabs");
  const tabScrollSize = await noteTabs.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(tabScrollSize.scrollWidth).toBeGreaterThan(tabScrollSize.clientWidth);
  await expect(noteTabs).toHaveClass(/has-right-fog/);
  await expect(noteTabs).not.toHaveClass(/has-left-fog/);
  await noteTabs.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
    element.dispatchEvent(new Event("scroll"));
  });
  await expect(noteTabs).toHaveClass(/has-left-fog/);
  await expect(noteTabs).not.toHaveClass(/has-right-fog/);
  const overviewTitle = (await page
    .locator("#board-overview-title")
    .boundingBox())!;
  const mobileOwner = (await page
    .locator(".board-overview-owner")
    .boundingBox())!;
  expect(mobileOwner.y).toBeGreaterThanOrEqual(
    overviewTitle.y + overviewTitle.height,
  );
  await expect(page.locator(".board-meta > span")).toHaveCount(4);
  await expect(page.locator(".board-meta time")).toHaveAttribute(
    "datetime",
    /\d{4}-\d{2}-\d{2}T/,
  );
  await expect(page.locator(".board-meta time")).toHaveCSS(
    "white-space",
    "nowrap",
  );
  await expect(page.getByRole("tab")).toHaveCount(boardPost.notes.length);
  const tabs = page.getByRole("tab");
  await expect(tabs.first()).toContainText("Follow-up shared note body");
  await expect(tabs.locator(".board-note-title")).toHaveText([
    "Follow-up shared note body",
    "abc",
    "Overflow verification shared note with a deliberately long title",
    "Private shared note body",
  ]);
  await expect(tabs.first().locator(".board-note-bookmark")).toHaveCount(1);
  await expect(tabs.nth(1).locator(".board-note-bookmark")).toHaveCount(0);
  const bookmarkBounds = (await tabs
    .first()
    .locator(".board-note-bookmark")
    .boundingBox())!;
  const bookmarkTitleBounds = (await tabs
    .first()
    .locator(".board-note-title")
    .boundingBox())!;
  expect(bookmarkBounds.x + bookmarkBounds.width).toBeLessThanOrEqual(
    bookmarkTitleBounds.x,
  );
  expect(bookmarkBounds.y + bookmarkBounds.height / 2).toBeCloseTo(
    bookmarkTitleBounds.y + bookmarkTitleBounds.height / 2,
    1,
  );
  await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".board-note-preview")).toHaveCount(1);
  expect(boardPost.notes.every((note) => note.content.trim().length > 2)).toBe(
    true,
  );
  expect(boardPost.notes.some((note) => note.content === "abc")).toBe(true);
  await page.setViewportSize({ width: 320, height: 800 });
  await tabs.first().click();
  const mobileFooter = page.locator(".board-mobile-footer .footer");
  await expect(mobileFooter).toBeVisible();
  await swipeTouch(page.locator(".board-note-preview"), "left");
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  await swipeTouch(page.locator(".board-note-preview"), "right");
  await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
  const swipeFooter = (direction: "left" | "right") =>
    swipeTouch(mobileFooter, direction);
  await swipeFooter("left");
  await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
  await swipeFooter("right");
  await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
  const mobileFooterBounds = (await mobileFooter.boundingBox())!;
  expect(mobileFooterBounds.y + mobileFooterBounds.height).toBeCloseTo(800, 1);
  await mobileFooter.locator(".dashboard-command").tap();
  await expect(page).toHaveURL(/[?&]panel=dashboard(?:&|$)/);
  await expect(page.locator("#dashboard-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
});
