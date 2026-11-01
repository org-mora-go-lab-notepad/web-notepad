import { expect } from "@playwright/test";

import { sharingTest as test } from "../../__fixture__";
import { getApi } from "../../__util__/request";

test("7. 공유 탭의 X 닫기는 에디터에서만 숨기고 서버 본문을 보존한다", async ({
  sharing: { owner, id },
}) => {
  const readGroup = async () =>
    (await (await getApi(owner.request, "/api/groups")).json()).groups.find(
      (group: { id: string }) => group.id === id,
    );
  const record = await readGroup();
  const tab = record.data.tabs[0];
  const updateResponse = owner.waitForResponse(
    (response) =>
      response.url().endsWith("/api/groups/update") &&
      response
        .request()
        .postDataJSON()
        .data?.tabs.some(
          (item: { id: string; open: boolean }) =>
            item.id === tab.id && !item.open,
        ),
  );
  await owner
    .getByRole("button", { name: `Close ${tab.title}`, exact: true })
    .click();
  const response = await updateResponse;
  expect(response.ok()).toBe(true);
  expect(response.request().postDataJSON().deletedTabIds ?? []).toEqual([]);
  const saved = await readGroup();
  expect(
    saved.data.tabs.find((item: { id: string }) => item.id === tab.id),
  ).toMatchObject({ id: tab.id, content: tab.content, open: false });
  await expect(
    owner.getByRole("button", { name: `Close ${tab.title}`, exact: true }),
  ).toHaveCount(0);
  await owner.reload();
  const reloaded = await readGroup();
  expect(
    reloaded.data.tabs.find((item: { id: string }) => item.id === tab.id),
  ).toMatchObject({ content: tab.content, open: false });
});
