import { expect } from "@playwright/test";

import { syncTest as test } from "./__fixture__";
import { openDevice, waitForSaved } from "./__util__";

test("2. 다른 기기의 화면을 다시 활성화하면 저장된 글을 가져온다", async ({
  devices: { desktop, mobile },
}) => {
  await test.step(
    "시나리오: 2. 다른 기기의 화면을 다시 활성화하면 저장된 글을 가져온다 — 준비 조건부터 공개 UI 또는 API 실행과 사용자 결과 검증까지 독립적으로 추적한다",
    async () => {
      await test.step(
        "실행 1: 2. 다른 기기의 화면을 다시 활성화하면 저장된 글을 가져온다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await openDevice(desktop);
        },
        { box: true },
      );

      await test.step(
        "실행 2: 2. 다른 기기의 화면을 다시 활성화하면 저장된 글을 가져온다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await openDevice(mobile);
        },
        { box: true },
      );

      await test.step(
        "실행 3: 2. 다른 기기의 화면을 다시 활성화하면 저장된 글을 가져온다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await desktop
            .locator("textarea")
            .first()
            .fill("열린 기기로 전달할 글");
        },
        { box: true },
      );

      await test.step(
        "실행 4: 2. 다른 기기의 화면을 다시 활성화하면 저장된 글을 가져온다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await waitForSaved(desktop);
        },
        { box: true },
      );

      await test.step(
        "실행 5: 2. 다른 기기의 화면을 다시 활성화하면 저장된 글을 가져온다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await mobile.evaluate(() => window.dispatchEvent(new Event("focus")));
        },
        { box: true },
      );

      await test.step(
        "검증 1: 2. 다른 기기의 화면을 다시 활성화하면 저장된 글을 가져온다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(mobile.locator("textarea:visible").first()).toHaveValue(
            "열린 기기로 전달할 글",
            { timeout: 15_000 },
          );
        },
        { box: true },
      );
    },
    { box: true },
  );
});
