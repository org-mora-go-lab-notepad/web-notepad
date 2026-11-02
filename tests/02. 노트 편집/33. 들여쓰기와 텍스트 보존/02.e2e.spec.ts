import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";

test("2. 여러 줄 내어쓰기는 공백 들여쓰기를 탭으로 오인해 제거하지 않는다", async ({
  page,
}) => {
  await test.step(
    "시나리오: 2. 여러 줄 내어쓰기는 공백 들여쓰기를 탭으로 오인해 제거하지 않는다 — 준비 조건부터 공개 UI 또는 API 실행과 사용자 결과 검증까지 독립적으로 추적한다",
    async () => {
      await test.step(
        "준비 1: 2. 여러 줄 내어쓰기는 공백 들여쓰기를 탭으로 오인해 제거하지 않는다 — 다른 사례와 독립적으로 실행하는 데 필요한 상태와 화면을 먼저 구성한다",
        async () => {
          await openEditor(page);
        },
        { box: true },
      );

      const editor = page.locator("textarea");

      await test.step(
        "실행 1: 2. 여러 줄 내어쓰기는 공백 들여쓰기를 탭으로 오인해 제거하지 않는다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await editor.fill("\tfirst\n  second\n\tthird");
        },
        { box: true },
      );

      await test.step(
        "실행 2: 2. 여러 줄 내어쓰기는 공백 들여쓰기를 탭으로 오인해 제거하지 않는다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await editor.evaluate((element: HTMLTextAreaElement) =>
            element.setSelectionRange(0, element.value.length),
          );
        },
        { box: true },
      );

      await test.step(
        "실행 3: 2. 여러 줄 내어쓰기는 공백 들여쓰기를 탭으로 오인해 제거하지 않는다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await editor.press("Shift+Tab");
        },
        { box: true },
      );

      await test.step(
        "검증 1: 2. 여러 줄 내어쓰기는 공백 들여쓰기를 탭으로 오인해 제거하지 않는다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(editor).toHaveValue("first\n  second\nthird");
        },
        { box: true },
      );

      await test.step(
        "검증 2: 2. 여러 줄 내어쓰기는 공백 들여쓰기를 탭으로 오인해 제거하지 않는다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(editor).toBeFocused();
        },
        { box: true },
      );
    },
    { box: true },
  );
});
