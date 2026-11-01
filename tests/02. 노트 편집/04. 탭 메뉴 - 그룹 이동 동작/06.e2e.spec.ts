import { expect, test } from "@playwright/test";

import {
  createBookmarkFixture,
  createClosedTabFixture,
  createGroupFixture,
  createTabFixture,
  signedSession,
} from "../../__fixture__";
import {
  authenticateBrowser,
  openTabMenu,
  readStoredState,
  waitForStoredState,
  writeStoredState,
} from "../../__util__";
import { getApi } from "../../__util__/request";

test("6. 마지막 열린 2자 탭을 이동해도 모든 그룹의 닫힌 본문과 북마크를 DB에 보존한다", async ({
  page,
  context,
  browser,
  baseURL,
}) => {
  const user = signedSession({
    id: `move-preserve-${crypto.randomUUID()}`,
    nickname: "Move User",
    expiresAt: Date.now() + 300_000,
  });
  await authenticateBrowser(context, user);
  const closed = createTabFixture("source-closed", "Keep source body", {
    open: false,
  });
  const source = createGroupFixture(
    "arrakis",
    "arrakis",
    [createTabFixture("moving", "ㅎㅎ"), closed],
    {
      bookmarks: [
        createBookmarkFixture("source-bookmark", closed.id, closed.content),
      ],
    },
  );
  const target = createGroupFixture("mora", "mora", [
    createTabFixture("target-open", "Keep target body"),
    createTabFixture("target-closed", "Keep target closed body", {
      open: false,
    }),
  ]);
  const other = createGroupFixture("mora-dev", "mora-dev", [
    createTabFixture("other-open", "Keep other body"),
    createTabFixture("other-closed", "Keep other closed body", { open: false }),
  ]);
  const ungrouped = createGroupFixture("ungrouped", "Ungrouped", [
    createTabFixture("ungrouped-note", "Keep ungrouped"),
  ]);
  await writeStoredState(page, {
    groups: [ungrouped, source, target, other],
    activeGroupId: source.id,
    nextTabNumber: 10,
    closedTabs: [
      createClosedTabFixture(
        "archived",
        source.id,
        createTabFixture("archived-note", "Keep archive", { open: false }),
      ),
    ],
  });
  await expect(page.locator("textarea")).toHaveValue("ㅎㅎ");
  await openTabMenu(page.getByRole("tab", { name: "ㅎㅎ", exact: true }));
  await page.getByRole("menuitem", { name: "Move Group", exact: true }).click();
  await page.getByRole("menuitem", { name: "mora", exact: true }).click();
  await expect(page.locator("textarea")).toHaveValue("");
  const readCloud = async () => {
    const data = await (
      await getApi(page.request, "/api/notepad/history")
    ).json();
    return data.latest ? JSON.parse(data.latest.snapshot) : null;
  };
  await expect
    .poll(
      async () =>
        (await readCloud())?.groups.find(
          (g: { id: string }) => g.id === target.id,
        ).tabs,
    )
    .toMatchObject([...target.tabs, createTabFixture("moving", "ㅎㅎ")]);
  const saved = await readCloud();
  const remaining = saved.groups.find(
    (g: { id: string }) => g.id === source.id,
  );
  expect(remaining.tabs).toContainEqual(expect.objectContaining(closed));
  expect(
    remaining.tabs.filter((tab: { open: boolean }) => tab.open),
  ).toHaveLength(1);
  expect(remaining.bookmarks).toEqual(source.bookmarks);
  expect(
    saved.groups.find((g: { id: string }) => g.id === other.id),
  ).toMatchObject(other);
  expect(
    saved.groups.find((g: { id: string }) => g.id === ungrouped.id),
  ).toMatchObject(ungrouped);
  expect(saved.closedTabs[0].tab.content).toBe("Keep archive");

  const fresh = await browser.newContext({ baseURL });
  try {
    await authenticateBrowser(fresh, user);
    const device = await fresh.newPage();
    await device.goto("/");
    await waitForStoredState(device);
    await expect
      .poll(
        async () =>
          (await readStoredState(device)).groups.find((g) => g.id === source.id)
            ?.tabs,
      )
      .toEqual(remaining.tabs);
    const restored = await readStoredState(device);
    expect(restored.groups.find((g) => g.id === target.id)?.tabs).toEqual(
      saved.groups.find((g: { id: string }) => g.id === target.id).tabs,
    );
    expect(restored.groups.find((g) => g.id === other.id)?.tabs).toMatchObject(
      other.tabs,
    );
    expect(restored.groups.find((g) => g.id === source.id)?.bookmarks).toEqual(
      source.bookmarks,
    );
  } finally {
    await fresh.close();
  }
});
