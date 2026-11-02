import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";
import { addTabButton } from "../../__util__";

test("2. Alt+위아래 화살표는 같은 패널의 탭 사이를 이동한다", async ({
  page,
}) => {
  await test.step(
    "시나리오: 2. Alt+위아래 화살표는 같은 패널의 탭 사이를 이동한다 — 준비 조건부터 공개 UI 또는 API 실행과 사용자 결과 검증까지 독립적으로 추적한다",
    async () => {
      await test.step(
        "준비 1: 2. Alt+위아래 화살표는 같은 패널의 탭 사이를 이동한다 — 다른 사례와 독립적으로 실행하는 데 필요한 상태와 화면을 먼저 구성한다",
        async () => {
          await openEditor(page);
        },
        { box: true },
      );

      const tabs = page.getByRole("tab");

      await test.step(
        "실행 1: 2. Alt+위아래 화살표는 같은 패널의 탭 사이를 이동한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await addTabButton(page).click();
        },
        { box: true },
      );

      await test.step(
        "실행 2: 2. Alt+위아래 화살표는 같은 패널의 탭 사이를 이동한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await page.keyboard.press("Alt+ArrowUp");
        },
        { box: true },
      );

      await test.step(
        "검증 1: 2. Alt+위아래 화살표는 같은 패널의 탭 사이를 이동한다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
        },
        { box: true },
      );

      await test.step(
        "실행 3: 2. Alt+위아래 화살표는 같은 패널의 탭 사이를 이동한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await page.keyboard.press("Alt+ArrowDown");
        },
        { box: true },
      );

      await test.step(
        "검증 2: 2. Alt+위아래 화살표는 같은 패널의 탭 사이를 이동한다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
        },
        { box: true },
      );
    },
    { box: true },
  );
});
