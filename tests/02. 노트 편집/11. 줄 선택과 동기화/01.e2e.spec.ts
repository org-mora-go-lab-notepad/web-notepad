import { test } from "@playwright/test";

import { openEditor } from "../../__util__";
import { expectSelectedLines, lineButtons } from "../../__util__";

test("1. Shift 클릭으로 기준 줄부터 지정 줄까지 범위를 선택하고 다시 해제한다", async ({
  page,
}) => {
  await test.step(
    "시나리오: 1. Shift 클릭으로 기준 줄부터 지정 줄까지 범위를 선택하고 다시 해제한다 — 준비 조건부터 공개 UI 또는 API 실행과 사용자 결과 검증까지 독립적으로 추적한다",
    async () => {
      await test.step(
        "준비 1: 1. Shift 클릭으로 기준 줄부터 지정 줄까지 범위를 선택하고 다시 해제한다 — 다른 사례와 독립적으로 실행하는 데 필요한 상태와 화면을 먼저 구성한다",
        async () => {
          await openEditor(page);
        },
        { box: true },
      );

      await test.step(
        "실행 1: 1. Shift 클릭으로 기준 줄부터 지정 줄까지 범위를 선택하고 다시 해제한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await page
            .locator("textarea")
            .fill("first\nsecond\nthird\nfourth\nfifth");
        },
        { box: true },
      );

      const lines = lineButtons(page);

      await test.step(
        "실행 2: 1. Shift 클릭으로 기준 줄부터 지정 줄까지 범위를 선택하고 다시 해제한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await lines.nth(0).click();
        },
        { box: true },
      );

      await test.step(
        "실행 3: 1. Shift 클릭으로 기준 줄부터 지정 줄까지 범위를 선택하고 다시 해제한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await lines.nth(4).click({ modifiers: ["Shift"] });
        },
        { box: true },
      );

      await test.step(
        "실행 4: 1. Shift 클릭으로 기준 줄부터 지정 줄까지 범위를 선택하고 다시 해제한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await expectSelectedLines(page, Array(5).fill(true));
        },
        { box: true },
      );

      await test.step(
        "실행 5: 1. Shift 클릭으로 기준 줄부터 지정 줄까지 범위를 선택하고 다시 해제한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await lines.nth(4).click({ modifiers: ["Shift"] });
        },
        { box: true },
      );

      await test.step(
        "실행 6: 1. Shift 클릭으로 기준 줄부터 지정 줄까지 범위를 선택하고 다시 해제한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await expectSelectedLines(page, Array(5).fill(false));
        },
        { box: true },
      );
    },
    { box: true },
  );
});
