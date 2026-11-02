import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";
import { openBookmarksPanel } from "../../__util__";

test("4. 북마크 모달 배경 클릭은 팝업을 닫고 편집기를 계속 사용할 수 있다", async ({
  page,
}) => {
  await test.step(
    "시나리오: 4. 북마크 모달 배경 클릭은 팝업을 닫고 편집기를 계속 사용할 수 있다 — 준비 조건부터 공개 UI 또는 API 실행과 사용자 결과 검증까지 독립적으로 추적한다",
    async () => {
      await test.step(
        "준비 1: 4. 북마크 모달 배경 클릭은 팝업을 닫고 편집기를 계속 사용할 수 있다 — 다른 사례와 독립적으로 실행하는 데 필요한 상태와 화면을 먼저 구성한다",
        async () => {
          await openEditor(page);
        },
        { box: true },
      );

      await test.step(
        "실행 1: 4. 북마크 모달 배경 클릭은 팝업을 닫고 편집기를 계속 사용할 수 있다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await openBookmarksPanel(page);
        },
        { box: true },
      );

      await test.step(
        "실행 2: 4. 북마크 모달 배경 클릭은 팝업을 닫고 편집기를 계속 사용할 수 있다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await page.mouse.click(4, 4);
        },
        { box: true },
      );

      await test.step(
        "검증 1: 4. 북마크 모달 배경 클릭은 팝업을 닫고 편집기를 계속 사용할 수 있다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(page.locator("#bookmarks-panel")).toBeHidden();
        },
        { box: true },
      );

      await test.step(
        "실행 3: 4. 북마크 모달 배경 클릭은 팝업을 닫고 편집기를 계속 사용할 수 있다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await page.locator("textarea").click();
        },
        { box: true },
      );

      await test.step(
        "실행 4: 4. 북마크 모달 배경 클릭은 팝업을 닫고 편집기를 계속 사용할 수 있다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await page.keyboard.type("Continue writing");
        },
        { box: true },
      );

      await test.step(
        "검증 2: 4. 북마크 모달 배경 클릭은 팝업을 닫고 편집기를 계속 사용할 수 있다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(page.locator("textarea")).toHaveValue(
            "Continue writing",
          );
        },
        { box: true },
      );
    },
    { box: true },
  );
});
