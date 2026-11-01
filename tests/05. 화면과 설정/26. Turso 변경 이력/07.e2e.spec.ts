import { expect, test } from "@playwright/test";

import { signedSession } from "../../__fixture__";
import { authenticateBrowser } from "../../__util__";
import { readCloudHistory } from "./__util__";

test("7. 탭을 닫아도 저장 대기 중인 본문을 DB에 보존하고 새로고침 후 복원한다", async ({
  page,
  context,
}) => {
  await authenticateBrowser(
    context,
    signedSession({
      id: `cloud-close-${crypto.randomUUID()}`,
      nickname: "Cloud User",
      expiresAt: Date.now() + 60_000,
    }),
  );
  await page.goto("/");
  await page.locator("textarea").first().fill("닫기 전에 저장할 본문");
  await page.locator(".tab-item.is-active .tab-close").click();
  await expect(page.locator(".home")).toHaveAttribute(
    "data-cloud-save",
    "saved",
  );
  const readSavedTab = async () => {
    const history = await readCloudHistory(page);
    if (!history.latest) return null;
    return JSON.parse(history.latest.snapshot).groups[0].tabs.find(
      (tab: { content: string }) => tab.content === "닫기 전에 저장할 본문",
    );
  };
  await expect
    .poll(readSavedTab)
    .toMatchObject({ content: "닫기 전에 저장할 본문", open: false });
  await page.reload();
  await expect(page.locator("textarea").first()).toHaveValue("");
  expect(await readSavedTab()).toMatchObject({
    content: "닫기 전에 저장할 본문",
    open: false,
  });
});
