import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";
import {
  chooseTabMenuItem,
  cycleActiveTabColor,
  readStoredState,
} from "../../__util__";

test("3. 북마크를 추가하면 탭 색상을 보관한다", async ({ page }) => {
  await test.step(
    "시나리오: 3. 북마크를 추가하면 탭 색상을 보관한다 — 준비 조건부터 공개 UI 또는 API 실행과 사용자 결과 검증까지 독립적으로 추적한다",
    async () => {
      await test.step(
        "준비 1: 3. 북마크를 추가하면 탭 색상을 보관한다 — 다른 사례와 독립적으로 실행하는 데 필요한 상태와 화면을 먼저 구성한다",
        async () => {
          await openEditor(page);
        },
        { box: true },
      );

      await test.step(
        "실행 1: 3. 북마크를 추가하면 탭 색상을 보관한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await page.locator("textarea").fill("bookmark color");
        },
        { box: true },
      );

      await test.step(
        "실행 2: 3. 북마크를 추가하면 탭 색상을 보관한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await cycleActiveTabColor(page, 2);
        },
        { box: true },
      );

      await test.step(
        "실행 3: 3. 북마크를 추가하면 탭 색상을 보관한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await chooseTabMenuItem(page, "Bookmark");
        },
        { box: true },
      );

      await test.step(
        "검증 1: 3. 북마크를 추가하면 탭 색상을 보관한다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          expect(
            (await readStoredState(page)).groups[0].bookmarks[0].tabColor,
          ).toBe("indigo");
        },
        { box: true },
      );
    },
    { box: true },
  );
});
