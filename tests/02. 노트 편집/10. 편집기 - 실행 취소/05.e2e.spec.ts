import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";

test("5. 실행 취소 후 새 편집을 시작하면 이전 다시 실행 기록을 제거한다", async ({
  page,
}) => {
  await test.step(
    "시나리오: 5. 실행 취소 후 새 편집을 시작하면 이전 다시 실행 기록을 제거한다 — 준비 조건부터 공개 UI 또는 API 실행과 사용자 결과 검증까지 독립적으로 추적한다",
    async () => {
      await test.step(
        "준비 1: 5. 실행 취소 후 새 편집을 시작하면 이전 다시 실행 기록을 제거한다 — 다른 사례와 독립적으로 실행하는 데 필요한 상태와 화면을 먼저 구성한다",
        async () => {
          await openEditor(page);
        },
        { box: true },
      );

      const editor = page.locator("textarea");

      await test.step(
        "실행 1: 5. 실행 취소 후 새 편집을 시작하면 이전 다시 실행 기록을 제거한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await editor.fill("first");
        },
        { box: true },
      );

      await test.step(
        "실행 2: 5. 실행 취소 후 새 편집을 시작하면 이전 다시 실행 기록을 제거한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await editor.fill("second");
        },
        { box: true },
      );

      await test.step(
        "실행 3: 5. 실행 취소 후 새 편집을 시작하면 이전 다시 실행 기록을 제거한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await editor.press("Meta+z");
        },
        { box: true },
      );

      await test.step(
        "검증 1: 5. 실행 취소 후 새 편집을 시작하면 이전 다시 실행 기록을 제거한다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(editor).toHaveValue("first");
        },
        { box: true },
      );

      await test.step(
        "실행 4: 5. 실행 취소 후 새 편집을 시작하면 이전 다시 실행 기록을 제거한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await editor.fill("branched");
        },
        { box: true },
      );

      await test.step(
        "실행 5: 5. 실행 취소 후 새 편집을 시작하면 이전 다시 실행 기록을 제거한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await editor.press("Meta+Shift+z");
        },
        { box: true },
      );

      await test.step(
        "검증 2: 5. 실행 취소 후 새 편집을 시작하면 이전 다시 실행 기록을 제거한다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(editor).toHaveValue("branched");
        },
        { box: true },
      );
    },
    { box: true },
  );
});
