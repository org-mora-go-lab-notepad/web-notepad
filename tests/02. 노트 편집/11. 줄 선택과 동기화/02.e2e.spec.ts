import { test } from "@playwright/test";

import { openEditor } from "../../__util__";
import { expectSelectedLines, lineButtons } from "../../__util__";

test("2. Shift 클릭으로 대상 줄이 속한 연속 선택 블록만 해제한다", async ({
  page,
}) => {
  await test.step(
    "시나리오: 2. Shift 클릭으로 대상 줄이 속한 연속 선택 블록만 해제한다 — 준비 조건부터 공개 UI 또는 API 실행과 사용자 결과 검증까지 독립적으로 추적한다",
    async () => {
      await test.step(
        "준비 1: 2. Shift 클릭으로 대상 줄이 속한 연속 선택 블록만 해제한다 — 다른 사례와 독립적으로 실행하는 데 필요한 상태와 화면을 먼저 구성한다",
        async () => {
          await openEditor(page);
        },
        { box: true },
      );

      await test.step(
        "실행 1: 2. Shift 클릭으로 대상 줄이 속한 연속 선택 블록만 해제한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await page
            .locator("textarea")
            .fill("one\ntwo\nthree\nfour\nfive\nsix");
        },
        { box: true },
      );

      const lines = lineButtons(page);

      await test.step(
        "실행 2: 2. Shift 클릭으로 대상 줄이 속한 연속 선택 블록만 해제한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          for (const index of [0, 1, 3, 4, 5]) {
            await lines.nth(index).click();
          }
        },
        { box: true },
      );

      await test.step(
        "실행 3: 2. Shift 클릭으로 대상 줄이 속한 연속 선택 블록만 해제한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await lines.nth(5).click({ modifiers: ["Shift"] });
        },
        { box: true },
      );

      await test.step(
        "실행 4: 2. Shift 클릭으로 대상 줄이 속한 연속 선택 블록만 해제한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await expectSelectedLines(page, [
            true,
            true,
            false,
            false,
            false,
            false,
          ]);
        },
        { box: true },
      );
    },
    { box: true },
  );
});
