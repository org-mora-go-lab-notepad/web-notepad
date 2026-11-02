import { test } from "@playwright/test";

import { openEditor } from "../../__util__";
import { expectSelectedLines, lineButtons } from "../../__util__";

test("5. 줄 선택과 선택 해제 결과를 새로고침 후 복원한다", async ({ page }) => {
  await test.step(
    "시나리오: 5. 줄 선택과 선택 해제 결과를 새로고침 후 복원한다 — 준비 조건부터 공개 UI 또는 API 실행과 사용자 결과 검증까지 독립적으로 추적한다",
    async () => {
      await test.step(
        "준비 1: 5. 줄 선택과 선택 해제 결과를 새로고침 후 복원한다 — 다른 사례와 독립적으로 실행하는 데 필요한 상태와 화면을 먼저 구성한다",
        async () => {
          await openEditor(page);
        },
        { box: true },
      );

      const editor = page.locator("textarea");

      const lines = lineButtons(page);

      await test.step(
        "실행 1: 5. 줄 선택과 선택 해제 결과를 새로고침 후 복원한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await editor.fill("one\ntwo\nthree");
        },
        { box: true },
      );

      await test.step(
        "실행 2: 5. 줄 선택과 선택 해제 결과를 새로고침 후 복원한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await lines.nth(1).click();
        },
        { box: true },
      );

      await test.step(
        "실행 3: 5. 줄 선택과 선택 해제 결과를 새로고침 후 복원한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await lines.nth(2).click();
        },
        { box: true },
      );

      await test.step(
        "실행 4: 5. 줄 선택과 선택 해제 결과를 새로고침 후 복원한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await page.reload();
        },
        { box: true },
      );

      await test.step(
        "실행 5: 5. 줄 선택과 선택 해제 결과를 새로고침 후 복원한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await expectSelectedLines(page, [false, true, true]);
        },
        { box: true },
      );

      await test.step(
        "실행 6: 5. 줄 선택과 선택 해제 결과를 새로고침 후 복원한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await lines.nth(1).click();
        },
        { box: true },
      );

      await test.step(
        "실행 7: 5. 줄 선택과 선택 해제 결과를 새로고침 후 복원한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await page.reload();
        },
        { box: true },
      );

      await test.step(
        "실행 8: 5. 줄 선택과 선택 해제 결과를 새로고침 후 복원한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await expectSelectedLines(page, [false, false, true]);
        },
        { box: true },
      );
    },
    { box: true },
  );
});
