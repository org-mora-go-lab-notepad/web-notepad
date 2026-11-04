import { expect, test } from "@playwright/test";

import { MOBILE_VIEWPORT } from "../../__constant__";
import { openEditor } from "../../__util__";

test("5. 모바일 탭 타이틀과 편집기는 기존 축소 크기를 유지하고 에디터만 1px 늘려 줄 번호 크기를 유지한다", async ({
  page,
}) => {
  await test.step(
    "시나리오: 5. 모바일 탭 타이틀과 편집기는 기존 축소 크기를 유지하고 에디터만 1px 늘려 줄 번호 크기를 유지한다 — 준비 조건부터 공개 UI 또는 API 실행과 사용자 결과 검증까지 독립적으로 추적한다",
    async () => {
      await test.step(
        "준비 1: 5. 모바일 탭 타이틀과 편집기는 기존 축소 크기를 유지하고 에디터만 1px 늘려 줄 번호 크기를 유지한다 — 다른 사례와 독립적으로 실행하는 데 필요한 상태와 화면을 먼저 구성한다",
        async () => {
          await page.setViewportSize(MOBILE_VIEWPORT);
        },
        { box: true },
      );

      await test.step(
        "준비 2: 5. 모바일 탭 타이틀과 편집기는 기존 축소 크기를 유지하고 에디터만 1px 늘려 줄 번호 크기를 유지한다 — 다른 사례와 독립적으로 실행하는 데 필요한 상태와 화면을 먼저 구성한다",
        async () => {
          await openEditor(page);
        },
        { box: true },
      );

      const editor = page.locator(".note-area:visible");

      await test.step(
        "검증 1: 5. 모바일 탭 타이틀과 편집기는 기존 축소 크기를 유지하고 에디터만 1px 늘려 줄 번호 크기를 유지한다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(editor).toHaveCSS("font-size", "15.1px");
        },
        { box: true },
      );

      await test.step(
        "검증 2: 5. 모바일 탭 타이틀과 편집기는 기존 축소 크기를 유지하고 에디터만 1px 늘려 줄 번호 크기를 유지한다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(page.locator(".tab-title").first()).toHaveCSS(
            "font-size",
            "13.38px",
          );
        },
        { box: true },
      );

      await test.step(
        "검증 3: 5. 모바일 탭 타이틀과 편집기는 기존 축소 크기를 유지하고 에디터만 1px 늘려 줄 번호 크기를 유지한다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(editor).toHaveCSS("line-height", "35px");
        },
        { box: true },
      );

      await test.step(
        "검증 4: 5. 모바일 탭 타이틀과 편집기는 기존 축소 크기를 유지하고 에디터만 1px 늘려 줄 번호 크기를 유지한다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(page.locator(".line-rail:visible")).toHaveCSS(
            "font-size",
            "10.8px",
          );
        },
        { box: true },
      );
    },
    { box: true },
  );
});
