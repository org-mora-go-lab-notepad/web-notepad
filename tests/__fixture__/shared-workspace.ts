import { expect, type Page, test as base } from "@playwright/test";

import type { GroupEntry } from "@/src/4-entity/notepad";

import { authenticateBrowser, groupsCommand } from "../__util__";
import { postApi } from "../__util__/request";
import { signedSession } from "./auth";
import { createGroupFixture, createTabFixture } from "./notepad-state";

type Sharing = {
  group: GroupEntry;
  owner: Page;
  guest: Page;
  id: string;
  token: string;
  url: string;
};
export const sharingTest = base.extend<{ sharing: Sharing }>({
  sharing: async ({ browser, baseURL }, provide) => {
    const ownerContext = await browser.newContext({
      baseURL,
      viewport: { width: 1280, height: 800 },
    });
    const guestContext = await browser.newContext({
      baseURL,
      viewport: { width: 1280, height: 800 },
    });
    try {
      const suffix = crypto.randomUUID();
      await authenticateBrowser(
        ownerContext,
        signedSession({
          id: "owner-" + suffix,
          nickname: "Owner",
          expiresAt: Date.now() + 300_000,
        }),
      );
      await authenticateBrowser(
        guestContext,
        signedSession({
          id: "guest-" + suffix,
          nickname: "Guest",
          expiresAt: Date.now() + 300_000,
        }),
      );
      const owner = await ownerContext.newPage(),
        guest = await guestContext.newPage();
      const shared = await postApi(owner.request, "/api/groups/share", {
        data: {
          group: createGroupFixture("local-" + suffix, "Shared team", [
            createTabFixture("note-" + suffix, "Keep this note"),
          ]),
        },
      });
      expect(shared.ok()).toBe(true);
      const { group, url } = await shared.json();
      const token = new URL(url).searchParams.get("share")!;
      expect(
        (
          await postApi(guest.request, "/api/groups/join", { data: { token } })
        ).ok(),
      ).toBe(true);
      for (const page of [owner, guest]) {
        await page.goto("/");
        await groupsCommand(page).click();
        const row = page.locator('[data-group-id="' + group.id + '"]');
        await expect(row).toBeVisible();
        await row.locator(".group-select").click();
      }
      await provide({ owner, guest, id: group.id, token, url, group });
    } finally {
      await ownerContext.close();
      await guestContext.close();
    }
  },
});
