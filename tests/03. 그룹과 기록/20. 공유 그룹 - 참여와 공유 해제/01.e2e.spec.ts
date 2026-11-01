import { expect } from "@playwright/test";

import { sharingTest as test } from "./__fixture__";
import { openSharingMenu } from "./__util__";

test("1. 공유 중인 주최자의 그룹 메뉴에는 공유하기와 공유 취소를 표시하지 않는다", async ({
  sharing: { owner, id },
}) => {
  for (const language of ["en", "ko"] as const) {
    if (language === "ko") {
      await owner.evaluate(() => {
        const key = "web-notepad-storage";
        const data = JSON.parse(localStorage.getItem(key)!);
        data.state.settings.language = "ko";
        localStorage.setItem(key, JSON.stringify(data));
      });
      await owner.reload();
      await expect(owner.locator("button.auth-command")).toBeVisible();
    }
    const menu = await openSharingMenu(owner, id);
    const row = owner.locator('[data-group-id="' + id + '"]');
    await expect(row.locator(".group-actions > button")).toHaveCount(1);
    const cancel = menu.getByRole("button", {
      name: language === "en" ? "Cancel Sharing" : "공유 취소",
      exact: true,
    });
    await expect(cancel).toHaveCount(0);
    await expect(menu.locator(".lucide-unlink")).toHaveCount(0);
    await expect(
      menu.getByRole("button", {
        name: /Share Shared team group|Shared team 그룹 공유하기|Leave group|그룹 나가기/,
      }),
    ).toHaveCount(0);
    await owner.keyboard.press("Escape");
    await row.locator(".group-select").click({ button: "right" });
    await expect(row.locator("[role=menuitem]")).toHaveText(
      language === "en" ? ["Pin to footer"] : ["푸터에 고정"],
    );
    await expect(owner.locator(".footer-pin-menu")).toHaveCount(0);
    await owner.keyboard.press("Escape");
  }
});
