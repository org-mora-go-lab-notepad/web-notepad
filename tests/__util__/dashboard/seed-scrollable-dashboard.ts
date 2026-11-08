import type { Page } from "@playwright/test";

import { createGroupFixture, createTabFixture } from "../../__fixture__";
import { writeStoredState } from "../state";
import { openPanel } from "../workspace";

export async function seedScrollableDashboard(page: Page) {
  await writeStoredState(page, {
    activeGroupId: "ungrouped",
    groups: [
      createGroupFixture(
        "ungrouped",
        "Ungrouped",
        Array.from({ length: 30 }, (_, index) =>
          createTabFixture(`tab-${index}`, `Task ${index}\nBody`, {
            tabColor: (["gray", "orange", "indigo", "teal"] as const)[
              index % 4
            ],
          }),
        ),
        { dashboardVisibility: { icebox: false, done: true } },
      ),
    ],
  });
  await openPanel(page, "dashboard-panel");
}
