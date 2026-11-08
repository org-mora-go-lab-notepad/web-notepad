import { expect, test } from "@playwright/test";

import { authenticateBrowser } from "../../__util__";
test("4. 그룹 영역 버튼은 고유한 실제 목록과 펼침 상태를 제공한다", async ({
  page,
}) => {
  await authenticateBrowser(page.context());
  await test.step(
    "시나리오: 4. 그룹 영역 버튼은 고유한 실제 목록과 펼침 상태를 제공한다 — 준비 조건부터 공개 UI 또는 API 실행과 사용자 결과 검증까지 독립적으로 추적한다",
    async () => {
      await test.step(
        "준비 1: 4. 그룹 영역 버튼은 고유한 실제 목록과 펼침 상태를 제공한다 — 다른 사례와 독립적으로 실행하는 데 필요한 상태와 화면을 먼저 구성한다",
        async () => {
          await page.goto("/");
        },
        { box: true },
      );

      await test.step(
        "실행 1: 4. 그룹 영역 버튼은 고유한 실제 목록과 펼침 상태를 제공한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await page.getByRole("button", { name: "Toggle groups" }).click();
        },
        { box: true },
      );

      const controls: Array<string | null> = [];

      await test.step(
        "검증 1: 4. 그룹 영역 버튼은 고유한 실제 목록과 펼침 상태를 제공한다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          for (const name of ["My Group", "Shared Group"]) {
            const button = page.getByRole("button", { name, exact: true });
            await expect(button).toHaveAttribute("aria-expanded", "true");
            const id = await button.getAttribute("aria-controls");
            expect(id).toBeTruthy();
            controls.push(id);
            await expect(page.locator("#" + id)).toBeVisible();
          }
        },
        { box: true },
      );

      await test.step(
        "검증 2: 4. 그룹 영역 버튼은 고유한 실제 목록과 펼침 상태를 제공한다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          expect(new Set(controls).size).toBe(2);
        },
        { box: true },
      );
    },
    { box: true },
  );
});
