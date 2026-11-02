import { expect, test } from "@playwright/test";

import { signedSession } from "../../__fixture__";
import { openEditor } from "../../__util__";
import {
  authenticateBrowser,
  createGroupsWithTabs,
  groupsCommand,
} from "../../__util__";
import { shareGroup } from "./__util__";

test("1. 그룹 공유 팝업은 링크와 복사하기·닫기 버튼을 제공한다", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await authenticateBrowser(
    context,
    signedSession({
      id: `share-owner-${crypto.randomUUID()}`,
      nickname: "Owner",
      expiresAt: Date.now() + 60_000,
    }),
  );
  await openEditor(page);
  await expect(page.locator("button.auth-command")).toBeVisible();
  const { dialog, url } = await shareGroup(page, "Team group");
  expect(url).toMatch(
    /^http:\/\/localhost:3000\/\?share=shared-[0-9a-f-]{36}\.[A-Za-z0-9_-]+$/,
  );
  await dialog.getByRole("button", { name: "Copy link" }).click();
  await expect(
    dialog.getByRole("button", { name: "Link copied" }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Close", exact: true })
    .last()
    .click();
  await expect(dialog).toHaveCount(0);

  await createGroupsWithTabs(page, "Empty shared group");
  await groupsCommand(page).click();
  const row = page.locator(".group-item", { hasText: "Empty shared group" });
  await row
    .getByRole("button", { name: "Empty shared group group actions" })
    .click();
  await row
    .getByRole("button", { name: "Share Empty shared group group" })
    .click();
  const emptyDialog = page.getByRole("dialog", {
    name: "Share Empty shared group",
  });
  await expect(emptyDialog.getByLabel("Group share link")).toBeVisible();
  await emptyDialog
    .getByRole("button", { name: "Close", exact: true })
    .last()
    .click();
  await expect(page.locator(".loading-mark")).toHaveCount(0);
  await expect(page.locator("textarea").first()).toBeVisible();
  await page.reload();
  await expect(page.locator(".loading-mark")).toHaveCount(0);
  await expect(page.locator("textarea").first()).toBeVisible();
});
