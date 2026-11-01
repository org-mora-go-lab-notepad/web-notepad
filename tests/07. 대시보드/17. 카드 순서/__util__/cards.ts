import { expect, type Locator, type Page } from "@playwright/test";

import { DEFAULT_SETTINGS } from "@/src/4-entity/notepad";

import { createGroupFixture, createTabFixture } from "../../../__fixture__";
import { beginDashboardDrag, writeStoredState } from "../../../__util__";
import { getApi } from "../../../__util__/request";

export async function seedCards(page: Page) {
  await writeStoredState(page, {
    settings: DEFAULT_SETTINGS,
    activeGroupId: "ungrouped",
    nextTabNumber: 10,
    groups: [
      createGroupFixture(
        "ungrouped",
        "Ungrouped",
        ["Alpha", "Beta", "Gamma"].map((name, i) =>
          createTabFixture("todo-" + i, name + "\nkept body", {
            tabColor: "gray",
            dashboardStatus: "todo",
          }),
        ),
      ),
      createGroupFixture("work", "Work", [
        createTabFixture("ready", "Queued", {
          tabColor: "orange",
          dashboardStatus: "ready",
        }),
      ]),
    ],
  });
}
export async function dropCard(
  page: Page,
  source: Locator,
  target: Locator,
  placement: "before" | "after" = "before",
) {
  const sourceElement = await source.elementHandle();
  const dataTransfer = await beginDashboardDrag(page, source);
  const box = (await target.boundingBox())!;
  const point = {
    dataTransfer,
    clientX: box.x + box.width / 2,
    clientY: placement === "before" ? box.y + 4 : box.y + box.height - 4,
  };
  await target.dispatchEvent("dragover", point);
  await expect(target).toHaveAttribute("data-drop-placement", placement);
  await target.dispatchEvent("drop", point);
  await sourceElement?.dispatchEvent("dragend");
  await sourceElement?.dispose();
  await dataTransfer.dispose();
}
export async function seedSharedCards(page: Page, id: string) {
  const record = (
    await (await getApi(page.request, "/api/groups")).json()
  ).groups.find((g: { id: string }) => g.id === id);
  const data = {
    ...record.data,
    tabs: ["Alpha", "Beta", "Gamma"].map((name, i) =>
      createTabFixture(id + "-" + i, name, {
        tabColor: "gray",
        dashboardStatus: "todo",
      }),
    ),
  };
  expect(
    (
      await page.request.post("/api/groups/update", {
        data: {
          id,
          baseRevision: record.revision,
          data,
          deletedTabIds: record.data.tabs.map((tab: { id: string }) => tab.id),
          confirmedDeletion: true,
        },
      })
    ).ok(),
  ).toBe(true);
  await page.reload();
}
